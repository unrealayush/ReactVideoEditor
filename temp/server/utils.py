from moviepy.editor import *
import requests
import os
from typing import Dict, Any
from moviepy.config import change_settings
import json


change_settings({"IMAGEMAGICK_BINARY": r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"})
