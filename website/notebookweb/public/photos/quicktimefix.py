url_links = "http://54.249.245.7/childnotebook/_design/media/_view/quicktime";
import urllib
import json
import qtrotate
import os

#fetch the list
urllib.urlretrieve (url_links, "links.json")

with open("links.json") as json_file:
	json_data = json.load(json_file)
	for item in json_data["rows"]:
		for file in item["value"]["files"]:
			urllib.urlretrieve (file["url"], file["file_name"])
			movie_rotation = qtrotate.get_set_rotation(file["file_name"])
			print "Downloading:" + file["url"] + " rotates " + str(movie_rotation)
			rotate_index = None
			if (movie_rotation == 90):
				rotate_index = 1;
			
			if (rotate_index != None):
				cmd =  "mencoder "+file["file_name"]+" -o rot_"+file["file_name"]+" -vf rotate="+str(rotate_index)+" -oac mp3lame -ovc lavc"
				print cmd
				os.system(cmd)
