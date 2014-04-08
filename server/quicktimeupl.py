import ftplib
from os import listdir, remove
from os.path import isfile, join
import const

mypath = "./"
onlyfiles = [];

for f in listdir(mypath):
	if isfile(join(mypath,f)):
		if f.startswith("tmp_"):
			onlyfiles.append(f)
session = ftplib.FTP('agame.webfactional.com',const.MEDIA_SERVER_USERNAME, const.MEDIA_SERVER_PASSWORD)
for f in onlyfiles:
	file = open(f,'rb')                  # file to send
	clean_name = f.replace("tmp_", "")
	session.storbinary('STOR webapps/media/childnotebook_files/' + clean_name, file)     # send the file
	file.close()                                    # close file and FTP
	try:
		remove(f)
	except OSError:
		pass
session.quit()

