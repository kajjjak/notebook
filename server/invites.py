url_links = "http://54.249.245.7/notebook/_design/list/_view/invite";
import urllib
import json
from mailgun import * #sudo pip install mailgun; sudo pip install simplejson


#fetch the list
urllib.urlretrieve (url_links, "invites.json")

with open("invites.json") as json_file:
	json_data = json.load(json_file)
	for item in json_data["rows"]:
		for email in item["value"]["email"]:
			print email



Mailgun.init("key-7tt4u03ilu2ca5t5eaaf3twwy9iit-d0")

MailgunMessage.send_txt("kjartan@sandbox46022.mailgun.org",
            "kjartan@agamecompany.com",
            "Hello",
            "Hi!\nI am sending the message using Mailgun");