url_links = "http://54.249.245.7/notebook/_design/list/_view/invite";
import urllib
import json
import const
import requests
#from mailgun import * #sudo pip install mailgun; sudo pip install simplejson


#fetch the list
urllib.urlretrieve (url_links, "invites.json")

#Mailgun.init("key-7tt4u03ilu2ca5t5eaaf3twwy9iit-d0")


mail_subject_template = "myPic #stream_name photos";
mail_message_template = "#source_name is sharing #stream_name with you.\nSimply follow this link to view the share.\n http://notebook.agamecompany.com/share?stream=#invite_id ";


def send_message(email, subject, message):
    print "Sending to " + email;
    return requests.post(
        const.MAIL_INVITE_MAILGUNAPI,
        auth=("api", const.MAIL_INVITE_MAILGUNKEY),
        data={"from": const.MAIL_INVITE_FROM,
              "to": [email],
              "subject": subject,
              "text": message})


with open("invites.json") as json_file:
	json_data = json.load(json_file)
	mail_sent = []
	for item in json_data["rows"]:
		email = item["value"]
		stream_name = email["name"]
		source_name = email["source"]
		#for email in item["value"]["email"]:
		if (email["email"] and email["send"]):
			invite_id = email["stream"]
			target_name = email["email"]
			if email.has_key("target"):
				target_name = email["target"]
			mail_message = mail_message_template
			mail_message = mail_message.replace("#target_name", target_name)
			mail_message = mail_message.replace("#source_name", source_name)
			mail_message = mail_message.replace("#invite_id",   invite_id)
			mail_message = mail_message.replace("#stream_name", stream_name)
			mail_subject = mail_subject_template
			mail_subject = mail_subject.replace("#stream_name", stream_name)
			mail_subject = mail_subject.replace("#target_name", target_name)
			resp = send_message(email["email"], mail_subject, mail_message)
			print resp.json()
			if resp.status_code == 200:
				mail_sent.append(email)

#change email[] to email{}

print mail_sent #to be used for cleanup