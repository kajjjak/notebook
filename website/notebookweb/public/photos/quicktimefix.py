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
			if(movie_rotation > 180):
				movie_rotation = movie_rotation - 180 
			if (movie_rotation == 90): rotate_index = "transpose=1";
			if (movie_rotation == -90): rotate_index = "transpose=0,transpose=0";
			if (movie_rotation == 180): rotate_index = "transpose=2,transpose=2";
			if (movie_rotation == 270): rotate_index = "transpose=3";
			if (rotate_index != None):
				#cmd =  "mencoder "+file["file_name"]+" -o rot_"+file["file_name"]+" -vf rotate="+str(rotate_index)+" -oac mp3lame -ovc lavc"
				#http://stackoverflow.com/questions/3937387/rotating-videos-with-ffmpeg
				# http://ffmpegmac.net/
				#	0 = 90CounterCLockwise and Vertical Flip (default)
				#	1 = 90Clockwise
				#	2 = 90CounterClockwise
				#	3 = 90Clockwise and Vertical Flip
				#
				cmd = './ffmpeg -i '+file["file_name"]+' -vf "'+rotate_index+'" -strict -2  tmp_'+file["file_name"]+''
				print cmd
				os.system(cmd)
				qtrotate.get_set_rotation('tmp_'+file["file_name"], 0)
