import os
import json
import pandas as pd
import geopandas as gpd
from data_utils import calculate_period_no2_coord_polygon

# Create detailed city_data/city_timepoints_YYYY_MM.json files
def create_detailed_city_timepoints(
        input_geojson='cities_major.geojson', 
        incidence_csv='COVID-19-Faelle_7-Tage-Inzidenz_Landkreise.csv',
        output_folder='../public/city_data_new/'
    ):
    cities_geojson = gpd.read_file(input_geojson)
    incidence_df = pd.read_csv(
        incidence_csv, 
        parse_dates=['Meldedatum'],
        dtype={'Landkreis_id': str}
    ).rename(columns={
        'Landkreis_id': 'AGS',
        'Meldedatum': 'date',
        'Inzidenz_7-Tage': 'incidence'})

    cities_geojson["Gemeindeschlüssel_AGS"] = cities_geojson["Gemeindeschlüssel_AGS"].apply(
        lambda x: str(x)[:5]  # Match to Landkreis_id
    )
    
    # Merge incidence data into city geodataframe
    merged = cities_geojson.merge(
        incidence_df, 
        left_on='Gemeindeschlüssel_AGS', 
        right_on='AGS', 
        how='left'
    )
    
    # Group by year and month to create separate files
    merged['year_month'] = merged['date'].dt.to_period('M')
    
    for period, group in merged.groupby('year_month'):
        year_month_str = period.strftime('%Y_%m')
        output_path = f"{output_folder}city_timepoints_{year_month_str}.json"
        
        city_timepoints = []
        # get monthly data for each city
        # get list of unique cities
        cities = group['GeografischerName_GEN'].unique()
        for city_name in cities:
            city_data = group[group['GeografischerName_GEN'] == city_name]
            city_timepoints.append({
                'cityName': city_name,
                'timestamp': period.strftime('%Y-%m'),
                'value': calculate_period_no2_coord_polygon(
                    city_data.geometry.values[0], year_month_str),
                'incidence': city_data['incidence'].mean(),
                'pValue': 0.06
            })
        
        with open(output_path, 'w') as f:
            json.dump(city_timepoints, f)

        baseline_path = f"{output_folder}city_timepoints_2019_{period.strftime('%m')}.json"
        if not (os.path.exists(baseline_path)):
            # Also create 2019 version with adjusted dates
            city_timepoints = []
            for city_name in cities:
                city_data = group[group['GeografischerName_GEN'] == city_name]
                city_timepoints.append({
                    'cityName': city_name,
                    'timestamp': period.strftime('2019-%m'),
                    'value': calculate_period_no2_coord_polygon(
                    city_data.geometry.values[0], period.strftime('2019_%m')),
                    'incidence': 0.0,
                    'pValue': 0.06
                })
            with open(baseline_path, 'w') as f:
                json.dump(city_timepoints, f)


# Create lightweight cities.json (for frontend)
def create_lightweight_city_data(
        input_geojson='cities_major.geojson', 
        output_json='../public/city_data/cities.json'
    ):
    cities_geojson = gpd.read_file(input_geojson)
    cities_light = []
    for _, city in cities_geojson.iterrows():
        lon, lat = city.geometry.representative_point().xy
        cities_light.append({
            'name': city['GeografischerName_GEN'],
            'lat': lat[0],
            'lng': lon[0],
            'population': int(city['Einwohnerzahl_EWZ'])
        })
    with open(output_json, 'w') as f:
        json.dump(cities_light, f)

if __name__ == "__main__":
    # create_lightweight_city_data()
    create_detailed_city_timepoints(output_folder='../public/city_data/')