import os
import rasterio
from rasterstats import zonal_stats

# Calculate NO2 data per city for a given month based on city's polygon
def calculate_period_no2_coord_polygon(coord_polygon, period, no2_data_folder='../public/data/'):
    """
    Calculate weighted average NO2 for a city polygon.
    
    Args:
        coord_polygon: GeoJSON-like geometry (shapely Polygon or MultiPolygon)
        period: datetime or string 'YYYY_MM'
        no2_data_folder: path to folder with GeoTIFF files
    
    Returns:
        float: weighted average NO2 value for the city
    """
    # it is expected, that period is a year, month combination as string or datetime
    period_str = period if isinstance(period, str) else period.strftime('%Y_%m')
    # Load NO2 data for the given period
    no2_data_path = os.path.join(no2_data_folder, f"no2_data_{period_str}.tif")
    if not os.path.exists(no2_data_path):
        print(f"Warning: NO2 file not found: {no2_data_path}")
        return None
    
    try:
        # Use zonal_statistics to calculate mean within polygon
        # This automatically handles partial pixel overlaps
        with rasterio.open(no2_data_path) as src:
            # Get statistics for the polygon geometry
            stats = zonal_stats(
                coord_polygon,
                src.read(1),  # Read first band
                affine=src.transform,
                stats=['mean']
            )
            
            if stats and len(stats) > 0:
                mean_no2 = stats[0]['mean']
                return mean_no2
            else:
                print(f"No data found for polygon in {period_str}")
                return None
                
    except Exception as e:
        print(f"Error processing {period_str}: {e}")
        return None
    