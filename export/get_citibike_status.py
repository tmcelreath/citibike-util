""" Pulls current station statuses from Citibike API and inserts them into mongo """
import requests
import json
import sys
from pymongo import MongoClient
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from time import sleep

client = MongoClient('ds055709.mongolab.com',55709)
db = client['citibike']
db.authenticate('admin','s10thr0p')
collection = db['stationstatuses']


def load_station_statuses():
    response = requests.get(
        'http://appservices.citibikenyc.com/data2/stations.php?updateOnly=true')
    response_json = json.loads(response.text)

    last_update_int = int(response_json['lastUpdate'])
    d = datetime.fromtimestamp(last_update_int)

    results = response_json['results']

    test = collection.find_one({'year': d.year, 'month': d.month, 'day': d.day, 'hour': d.hour, 'minute': d.minute})

    print(test)

    if(test is None):
        for result in results:
            status = {
                'bikes': result['availableBikes'],
                'docks': result['availableDocks'],
                'status': result['status'],
                'year': d.year,
                'month': d.month,
                'day': d.day,
                'weekday': d.weekday(),
                'hour': d.hour,
                'minute': d.minute,
                'date': d
            }
            collection.insert(status)
            print(status)


def main():
    sched = BackgroundScheduler()
    job = sched.add_job(load_station_statuses, 'interval', minutes=10)
    sched.start()


if __name__ == '__main__':
    main()
    while(True):
        sleep(1)
        sys.stdout.write('.')
        sys.stdout.flush()
