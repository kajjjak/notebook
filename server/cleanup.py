url_links = "http://54.249.245.7/notebook/_design/media/_view/destroyed";
import urllib
import json
import couchdb
import ftplib

#fetch the list
urllib.urlretrieve (url_links, "destroyed.json")

couch = couchdb.Server('http://54.249.245.7/')
couchdb = couch['notebook'];

session = ftplib.FTP('agame.webfactional.com','agame','70d7fbaa')


with open("destroyed.json") as json_file:
	json_data = json.load(json_file)
	for item in json_data["rows"]:
		for file in item["value"]["files"]:			
			response = session.delete('webapps/media/childnotebook_files/' + file["file_name"])     # send the file
			print "Removing remote file " + file["file_name"] + " >>> " + response
		print "Removing remote document " + item["id"]
		del couchdb[item["id"]]

session.quit()

