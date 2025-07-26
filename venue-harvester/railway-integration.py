#!/usr/bin/env python3
"""
Railway Integration for Finding Sports Venue Harvester
Flask API + Scheduled harvesting for Railway deployment
"""

import os
import json
import asyncio
import threading
import time
from datetime import datetime
from flask import Flask, jsonify, request
from railway_optimized_harvester import RailwayHarvester, railway_harvest
import logging

# Railway-specific configuration
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Setup logging for Railway
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for Railway
last_harvest_time = None
harvest_in_progress = False
harvest_results = None

@app.route('/')
def home():
    """Home page with API documentation"""
    return jsonify({
        "service": "Finding Sports Venue Harvester",
        "version": "1.0.0",
        "status": "active",
        "deployment": "railway",
        "endpoints": {
            "/": "API documentation",
            "/api/venues": "Get all harvested venues",
            "/api/venues/search": "Search venues by city or sport",
            "/api/harvest": "Trigger manual harvest",
            "/api/status": "Get harvest status",
            "/health": "Health check"
        },
        "description": "Automated sports venue data harvesting for BC, Canada"
    })

@app.route('/health')
def health_check():
    """Railway health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "venue-harvester"
    })

@app.route('/api/venues')
def get_venues():
    """Get all harvested venues"""
    try:
        harvester = RailwayHarvester()
        venues = harvester.get_venues_json()
        
        return jsonify({
            "success": True,
            "count": len(venues),
            "venues": venues,
            "last_harvest": last_harvest_time,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error retrieving venues: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "count": 0,
            "venues": []
        }), 500

@app.route('/api/venues/search')
def search_venues():
    """Search venues by city or sport"""
    city = request.args.get('city', '').lower()
    sport = request.args.get('sport', '').lower()
    
    try:
        harvester = RailwayHarvester()
        all_venues = harvester.get_venues_json()
        
        filtered_venues = []
        
        for venue in all_venues:
            # Filter by city
            if city and city not in venue.get('city', '').lower():
                continue
            
            # Filter by sport
            if sport:
                venue_sports = [s.lower() for s in venue.get('sports', [])]
                if not any(sport in vs for vs in venue_sports):
                    continue
            
            filtered_venues.append(venue)
        
        return jsonify({
            "success": True,
            "count": len(filtered_venues),
            "venues": filtered_venues,
            "filters": {
                "city": city if city else None,
                "sport": sport if sport else None
            },
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error searching venues: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "count": 0,
            "venues": []
        }), 500

@app.route('/api/harvest', methods=['POST'])
def trigger_harvest():
    """Manually trigger venue harvesting"""
    global harvest_in_progress, last_harvest_time, harvest_results
    
    if harvest_in_progress:
        return jsonify({
            "success": False,
            "message": "Harvest already in progress",
            "last_harvest": last_harvest_time
        }), 409
    
    try:
        # Start harvest in background thread
        def run_harvest():
            global harvest_in_progress, last_harvest_time, harvest_results
            
            harvest_in_progress = True
            logger.info("Manual harvest triggered")
            
            try:
                # Run async harvest in new event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                result = loop.run_until_complete(railway_harvest())
                
                harvest_results = result
                last_harvest_time = datetime.now().isoformat()
                
                logger.info(f"Manual harvest completed: {result['venues_stored']} venues")
                
            except Exception as e:
                logger.error(f"Manual harvest failed: {e}")
                harvest_results = {"error": str(e)}
            
            finally:
                harvest_in_progress = False
                loop.close()
        
        # Start harvest thread
        harvest_thread = threading.Thread(target=run_harvest)
        harvest_thread.daemon = True
        harvest_thread.start()
        
        return jsonify({
            "success": True,
            "message": "Harvest started",
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error starting harvest: {e}")
        harvest_in_progress = False
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/status')
def get_status():
    """Get current harvest status"""
    return jsonify({
        "harvest_in_progress": harvest_in_progress,
        "last_harvest_time": last_harvest_time,
        "last_harvest_results": harvest_results,
        "timestamp": datetime.now().isoformat()
    })

def run_scheduled_harvest():
    """Run scheduled harvest every 6 hours"""
    global harvest_in_progress, last_harvest_time, harvest_results
    
    logger.info("Starting scheduled harvest service")
    
    while True:
        try:
            # Wait 6 hours between harvests
            time.sleep(6 * 60 * 60)  # 6 hours
            
            if harvest_in_progress:
                logger.info("Skipping scheduled harvest - already in progress")
                continue
            
            harvest_in_progress = True
            logger.info("Starting scheduled harvest")
            
            # Run harvest
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            result = loop.run_until_complete(railway_harvest())
            
            harvest_results = result
            last_harvest_time = datetime.now().isoformat()
            
            logger.info(f"Scheduled harvest completed: {result['venues_stored']} venues stored")
            
        except Exception as e:
            logger.error(f"Scheduled harvest failed: {e}")
            harvest_results = {"error": str(e)}
        
        finally:
            harvest_in_progress = False
            if 'loop' in locals():
                loop.close()

def run_initial_harvest():
    """Run initial harvest on startup"""
    global harvest_in_progress, last_harvest_time, harvest_results
    
    # Wait a bit for Railway to fully start
    time.sleep(30)
    
    if harvest_in_progress:
        return
    
    try:
        harvest_in_progress = True
        logger.info("Running initial harvest on startup")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(railway_harvest())
        
        harvest_results = result
        last_harvest_time = datetime.now().isoformat()
        
        logger.info(f"Initial harvest completed: {result['venues_stored']} venues stored")
        
    except Exception as e:
        logger.error(f"Initial harvest failed: {e}")
        harvest_results = {"error": str(e)}
    
    finally:
        harvest_in_progress = False
        if 'loop' in locals():
            loop.close()

# Railway startup
if __name__ == '__main__':
    # Start scheduled harvest thread
    harvest_thread = threading.Thread(target=run_scheduled_harvest)
    harvest_thread.daemon = True
    harvest_thread.start()
    
    # Start initial harvest thread
    initial_thread = threading.Thread(target=run_initial_harvest)
    initial_thread.daemon = True
    initial_thread.start()
    
    # Start Flask app
    port = int(os.environ.get('PORT', 8080))
    
    logger.info(f"Starting Finding Sports Venue Harvester on port {port}")
    logger.info("Scheduled harvests every 6 hours")
    logger.info("API endpoints available at /api/venues, /api/harvest, /api/status")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,  # Production mode for Railway
        threaded=True
    )