# -*- coding: utf-8 -*-
"""
Created on Wed May  8 01:22:54 2024

@author: valen
"""
from flask import Flask, render_template, request, jsonify
import folium
import random
import logging
import random
import pandas as pd
import tempfile
import os
import numpy as np
import requests
from bs4 import BeautifulSoup
import math
import webbrowser
import openpyxl

app = Flask(__name__)

# Obtenir le chemin du répertoire du script actuel
directory = os.path.dirname(os.path.abspath(__file__))
path = ''

def get_file_path():
    # Définir le chemin relatif par rapport à l'emplacement de ce script
    relative_path = os.path.join('data', 'PJT POSM biss.xlsm')
    
    # Obtenir le chemin absolu en utilisant le chemin de base défini manuellement
    absolute_path = os.path.join(directory, relative_path)
    
    return absolute_path

file_path = get_file_path()

# Remplacer les backslashes par des slashes pour la compatibilité avec différents systèmes
for letter in file_path:
    if letter == '\\':
        path += '/'   
    else: 
        path += letter

def lettre(n):
    letter = ''
    while n > 0:
        n -= 1
        letter = chr(n % 26 + ord('A')) + letter
        n //= 26
    return letter
Tmax=10
M=0
# Paramètres de l'algorithme génétique
POPULATION_SIZE = 400
GENERATIONS = 2000
MUTATION_RATE = 0.03
CROSSOVER_RATE = 0.8
MAX_ROUTE_TIME = 600  # en minutes
VEHICLE_CAPACITY = 200  # capacité maximale de chaque véhicule

def create_initial_population(pop_size, customers_nodes, depot_nodes,set_of_all_depots):
    route=[]
    for _ in range(pop_size):
        R=[]
        depot=random.sample(set_of_all_depots, 1)
        R=R+depot
        R=R+random.sample(customers_nodes, len(customers_nodes))
        R=R+depot
        route.append(R)
    return route

# Fonction objective
def evaluate_solution(routes,set_of_all_customers, set_of_all_depots, distance, P, t):
    total_distance = 0
    total_penalty = 0
    for route in routes:
        if not route:
            continue
        load = 0
        time_spent = 0
        last_node=route[0]
        for node in route:
            if node in set_of_all_customers:
                load += P[node]
                time_spent+= t[node]
            if load > 200:
                total_penalty += (load - VEHICLE_CAPACITY) * 1000  # Pénalité pour excès de capacité
            if node >=(len(distance))**0.5 or last_node >=(len(distance))**0.5 :
                D = 100000
                total_distance += D
                time_spent += D / 60  # Hypothèse: vitesse de 60 km/h
                last_node = node
            if node < (len(distance))**0.5 and last_node < (len(distance))**0.5:
                D = distance[(last_node, node)]
                total_distance += D
                time_spent += D / 60  # Hypothèse: vitesse de 60 km/h
                last_node = node
        if time_spent > MAX_ROUTE_TIME:
            total_penalty += (time_spent - MAX_ROUTE_TIME) * 1000  # Pénalité pour excès de temps
        if route[-1] in set_of_all_customers:
            total_penalty += 100000
        if route[0] in set_of_all_customers:
            total_penalty += 100000
        if route[0] != route[-1]:
            total_penalty += 100000000
        if len(route)!=len(set_of_all_customers)+2:
            total_penalty += 10000000000
        for node in route[1:len(route)-1]:
            if node in set_of_all_depots:
                total_penalty += 100000
    return total_distance + total_penalty

# Fonction de croisement
def crossover(parent1, parent2):
    child1, child2 = parent1[:], parent2[:]
    if random.random() > CROSSOVER_RATE:
        return child1, child2
    start, end = sorted(random.sample(range(len(parent1)), 2))
    middle_gen1 = parent2[start:end+1]
    middle_gen2 = parent1[start:end+1]
    child1 = [gene for gene in parent1 if gene not in middle_gen1] 
    child1[start:start] = middle_gen1
    child2 = [gene for gene in parent2 if gene not in middle_gen2]
    child2[start:start] = middle_gen2
    return child1, child2

# Fonction de mutation
def mutate(route):
    for _ in range(len(route)):
        if random.random() < MUTATION_RATE:
            idx1, idx2 = random.sample(range(len(route)), 2)
            route[idx1], route[idx2] = route[idx2], route[idx1]
      
# Algorithme génétique principal
def genetic_algorithm(set_of_all_customers, set_of_all_depots, distance, P, t):
    population = create_initial_population(POPULATION_SIZE, set_of_all_customers, set_of_all_depots,set_of_all_depots)
    for generation in range(GENERATIONS):
        # Évaluer la population
        fitness_scores = [evaluate_solution([individual],set_of_all_customers, set_of_all_depots, distance, P, t) for individual in population]
        # Sélectionner les meilleurs pour reproduction
        parents_indices = list(sorted(range(len(fitness_scores)), key=lambda i: fitness_scores[i]))[:POPULATION_SIZE//2]
        parents = [population[i] for i in parents_indices]
        # Générer la prochaine génération
        next_generation = []
        while len(next_generation) < POPULATION_SIZE:
            parent1, parent2 = random.sample(parents, 2)
            child1, child2 = crossover(parent1, parent2)
            mutate(child1)
            mutate(child2)
            next_generation.extend([child1, child2])
        npopulation = next_generation
        # Afficher le meilleur score de la génération
        if generation % 10 == 0 or generation == GENERATIONS - 1:
            best_score = min(fitness_scores)
            print(f"Generation {generation}: Best Distance = {best_score}")
        if min([evaluate_solution([individual],set_of_all_customers, set_of_all_depots, distance, P, t) for individual in npopulation])>best_score:
            npopulation=population
        population=npopulation
    return population[fitness_scores.index(min(fitness_scores))]

def generate_map(route_coordinates,route_adresses, atoc, aton, set_of_all_customers, set_of_all_depots):
    map = folium.Map(location=route_coordinates[0][0], zoom_start=9)
    folium.PolyLine(route_coordinates, color='red').add_to(map)
    for adress in route_adresses:
        if aton[adress] in set_of_all_customers:
            folium.Marker(atoc[adress], popup='Official Cartier Store: ' + adress, icon=folium.Icon(color='blue')).add_to(map)
        elif aton[adress] in set_of_all_depots:
            folium.Marker(atoc[adress], popup='Professional recycling and waste recovery: ' + adress, icon=folium.Icon(color='red')).add_to(map)
    return map._repr_html_()

def get_route_data(start_coord, end_coord, bing_maps_key):
    # Construire l'URL pour l'API Directions
    base_url = "http://dev.virtualearth.net/REST/v1/Routes"
    params = {
        "wayPoint.1": f"{start_coord[0]},{start_coord[1]}",
        "wayPoint.2": f"{end_coord[0]},{end_coord[1]}",
        "key": bing_maps_key,
    }
    response = requests.get(base_url, params=params)
    data = response.json()
    # Extraire les points de route
    #route_points = data['resourceSets'][0]['resources'][0]['routeLegs']['line']['coordinates']
    #return route_points
    #print(data)
    return data

def extract_route_coordinates(data):
    coordinates = []
    for i in range(0, len(data['resourceSets'][0]['resources'][0]['routeLegs'][0]['itineraryItems'])):
        coordinates.append(data['resourceSets'][0]['resources'][0]['routeLegs'][0]['itineraryItems'][i]['maneuverPoint']['coordinates'])
    return coordinates

# Clé API de Bing Maps
bing_maps_key = 'Ajl3cQlRdvEuer5vei_e6r5xjum8gmm5ycsr6J43mJ5AEY6gUKZu9ejcjDtSBHMp'
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
   
    bing_maps_key = 'Ajl3cQlRdvEuer5vei_e6r5xjum8gmm5ycsr6J43mJ5AEY6gUKZu9ejcjDtSBHMp'
    vehicle = request.form.get('vehicle')
    service = request.form.get('service')
    option = request.form.get('option')
    sheetname = 'Database Cartier' + ' '+ str(option)
    distmatrix = 'Distance Matrix' + ' '+ str(option)
    ## ENSEMBLE DE TOUS LES DEPOTS RECYCLAGE
    data = pd.read_excel(path,sheet_name='Database Veolia' + ' '+ str(service)) # Lire le fichier Excel
    database = data['Adress']
    coordonees_veolia = data['LatLon']
    set_of_all_depots_latlon=coordonees_veolia.values.tolist()
    set_of_all_depots=database.values.tolist()
    atoc={}
    for i in range(0,len(set_of_all_depots)):
        atoc[set_of_all_depots[i]]=eval(set_of_all_depots_latlon[i])

    ## ENSEMBLE DE TOUTES LES BOUTIQUES
    data = pd.read_excel(path,sheet_name=sheetname) # Lire le fichier Excel
    database = data['Adress']
    coordonees_cart = data['LatLon']
    set_of_all_customers=database.values.tolist()
    set_of_all_customers_latlon=coordonees_cart.values.tolist()
    atocc={}
    for i in range(0,len(set_of_all_customers)):
        atocc[set_of_all_customers[i]]=eval(set_of_all_customers_latlon[i])
    atoc.update(atocc)
    ## ENSEMBLE DE TOUTES LES DESTINATIONS
    set_of_all_nodes=set_of_all_customers + set_of_all_depots
    
    ## ENSEMBLE DE TOUS LES VEHICULES
    data = pd.read_excel(path,sheet_name='Database Vehicle') # Lire le fichier Excel
    database = data['MPLW']
    emission = data['Emissions']
    set_of_all_vehicles=database.values.tolist()
    emissions=emission.values.tolist()
    vhl={}
    for i in range (0,len(set_of_all_vehicles)):
        vhl[set_of_all_vehicles[i]]=emissions[i]
    
    ## ADRESS TO NUMBER
    aton={}
    for i in range(0,len(set_of_all_nodes)):
        aton[set_of_all_nodes[i]]=i
        
    ntoa={}
    for i in range(0,len(aton)):
        ntoa[i]=set_of_all_nodes[i]

    ## ASSOCIE DES ADRESSES AU NOMBRES
    for i in range(0,len(set_of_all_customers)):    #numerote les boutiques
        set_of_all_customers[i]=aton[set_of_all_customers[i]]
        
    for i in range(0,len(set_of_all_depots)):   #numerote les dépots
        set_of_all_depots[i]=aton[set_of_all_depots[i]]

    set_of_all_nodes=set_of_all_customers + set_of_all_depots #numerote tous les noeuds

    ## DISTANCE noeud
    distance={}
    data = pd.read_excel(path,sheet_name=distmatrix) # Lire le fichier Excel
    database = data.loc[1:data['A'].count(),[lettre(i) for i in range(1, data['A'].count()+2)]]
    excel_database=database.values.tolist() # Convertir les données en liste

    for i in range (0,len(excel_database)): #suppression éléments nan
        for j in range (1, len(excel_database[i])):
            if math.isnan(excel_database[i][j]):
                excel_database[i].pop(j)
                
    for i in range (0,len(excel_database)): #création du dictionnaire
        for j in range (0, len(excel_database[i])-1):
            distance[aton[excel_database[i][0]],aton[excel_database[j][0]]]=excel_database[i][j+1]
       
    ## DEMANDE DES BOUTIQUES
    D={}
    for i in range (0,len(set_of_all_customers)): #création du dictionnaire
        D[set_of_all_customers[i]]=0

    ## RECUPERATION AUX BOUTIQUES
    P={}
    for i in range (0,len(set_of_all_customers)): #création du dictionnaire
        P[set_of_all_customers[i]]=137/len(set_of_all_customers)

    ## TEMPS DE TRAJET
    T={}
    for i in range (0,len(excel_database)): #création du dictionnaire
        for j in range (0, len(excel_database[i])-1):
            T[aton[excel_database[i][0]],aton[excel_database[j][0]]]=excel_database[i][j+1]/30

    ## TEMPS DE TÂCHE
    t={}
    for i in range (0,len(set_of_all_customers)): #création du dictionnaire
        t[i]=0.5

    ## CHARGE MAXI DU VEHICULE
    Q={}
    for i in range (0,len(set_of_all_vehicles)): #création du dictionnaire
        Q[set_of_all_vehicles[i]]=200
    
    route_points = []
    # Calculer un itinéraire
    best_solution = genetic_algorithm(set_of_all_customers, set_of_all_depots, distance, P, t)
    if evaluate_solution([best_solution],set_of_all_customers, set_of_all_depots, distance, P, t)>2000:
        best_solution = genetic_algorithm(set_of_all_customers, set_of_all_depots, distance, P, t)
    for i in range(0,len(best_solution)):
        best_solution[i] = ntoa[best_solution[i]]
    temp_adress = best_solution[0]
    # Calcul route
    for i in range(1,len(best_solution)):
        route_data = get_route_data(atoc[temp_adress], atoc[best_solution[i]], bing_maps_key)
        route_points.append(extract_route_coordinates(route_data))
        temp_adress = best_solution[i]
    # Calcul distance
    routee = [aton[adress] for adress in best_solution]
    dist = evaluate_solution([routee],set_of_all_customers, set_of_all_depots, distance, P, t)
    distance = str(round(dist,3))+' km'
    cbfp = str(round(dist*vhl[vehicle],3)) + ' kg.eq CO2'
    Service = str(service)
    # Générer une carte
    map_html = generate_map(route_points, best_solution, atoc, aton, set_of_all_customers, set_of_all_depots)
    best_sol = str(best_solution)
    return render_template('map.html', map_html=map_html, best_sol=best_sol, distance=distance, cbfp=cbfp, Service=Service)
url='http://127.0.0.1:5000'
webbrowser.open(url)
if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
