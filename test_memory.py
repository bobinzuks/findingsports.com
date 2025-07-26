#!/usr/bin/env python3
"""Test memory usage of Railway harvester"""
import psutil
import os
import asyncio
from railway_optimized_harvester import RailwayHarvester

async def test_memory():
    """Check memory usage"""
    process = psutil.Process(os.getpid())
    
    # Initial memory
    initial_mem = process.memory_info().rss / 1024 / 1024  # MB
    print(f"Initial memory: {initial_mem:.1f} MB")
    
    # Create harvester
    harvester = RailwayHarvester()
    harvester.setup_database()
    
    # After setup
    setup_mem = process.memory_info().rss / 1024 / 1024
    print(f"After setup: {setup_mem:.1f} MB")
    
    # Simulate parsing
    from bs4 import BeautifulSoup
    html = "<div>" * 1000 + "test" + "</div>" * 1000
    soup = BeautifulSoup(html, 'html.parser')
    
    # After parsing
    parse_mem = process.memory_info().rss / 1024 / 1024
    print(f"After parsing: {parse_mem:.1f} MB")
    
    print(f"\nTotal memory usage: {parse_mem:.1f} MB")
    print(f"Railway limit: 512 MB")
    print(f"Usage percentage: {(parse_mem/512)*100:.1f}%")
    
    if parse_mem < 100:
        print("✅ Memory usage is excellent for Railway!")
    elif parse_mem < 200:
        print("✅ Memory usage is good for Railway!")
    else:
        print("⚠️  Memory usage might be high for small Railway instances")

if __name__ == "__main__":
    asyncio.run(test_memory())