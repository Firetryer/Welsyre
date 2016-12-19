from PIL import Image
import os
import json
source_directory = "../client/assets/sprites"
target_directory = "../client/assets/"

image_properties = {
		
}

for filename in os.listdir(source_directory):
    if filename.endswith(".png"):
    	file      = Image.open(source_directory+"/"+filename)
    	file_name = filename.split('.')[0]
    	file_width, file_height= file.size
        image_properties[file_name] = {
            'name'  : file_name,
        	'width' : file_width,
        	'height': file_height
        }
        continue

with open(target_directory+'/data.json', 'w') as outfile:
    json.dump(image_properties, outfile)