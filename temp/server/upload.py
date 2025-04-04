from moviepy.editor import VideoFileClip, concatenate_videoclips, CompositeVideoClip
from moviepy.video.fx.fadein import fadein
from moviepy.video.fx.fadeout import fadeout

# Function to apply transitions
def apply_transition(clip1, clip2, transition):
    duration = transition.get("duration", 0.5)  # Default duration
    kind = transition.get("kind", "none")  # Default transition type

    if kind == "none":
        # Simple concatenation without transition
        return concatenate_videoclips([clip1, clip2])

    elif kind == "fade":
        # Apply fade-out to clip1 and fade-in to clip2
        clip1 = fadeout(clip1, duration)
        clip2 = fadein(clip2, duration)
        return concatenate_videoclips([clip1, clip2])

    elif kind == "slide":
        direction = transition.get("direction", "from-left")
        # Slide effect (custom logic per direction)
        w, h = clip1.size
        if direction == "from-right":
            clip1 = clip1.set_position(lambda t: (-w * t / duration, 0)).set_duration(duration)
            clip2 = clip2.set_position(lambda t: (w - w * t / duration, 0)).set_start(duration).set_duration(duration)
        elif direction == "from-left":
            clip1 = clip1.set_position(lambda t: (w * t / duration, 0)).set_duration(duration)
            clip2 = clip2.set_position(lambda t: (-w + w * t / duration, 0)).set_start(duration).set_duration(duration)
        elif direction == "from-top":
            clip1 = clip1.set_position(lambda t: (0, h * t / duration)).set_duration(duration)
            clip2 = clip2.set_position(lambda t: (0, -h + h * t / duration)).set_start(duration).set_duration(duration)
        elif direction == "from-bottom":
            clip1 = clip1.set_position(lambda t: (0, -h * t / duration)).set_duration(duration)
            clip2 = clip2.set_position(lambda t: (0, h - h * t / duration)).set_start(duration).set_duration(duration)

        transition_clip = CompositeVideoClip([clip1, clip2], size=clip1.size).set_duration(duration)
        return concatenate_videoclips([clip1.set_end(clip1.duration - duration), transition_clip, clip2])

    elif kind == "wipe":
        # Implement wipe transition (e.g., directional masking)
        direction = transition.get("direction", "from-left")
        # Add wipe logic as needed
        pass

    elif kind == "flip":
        # Implement flip transition (advanced)
        pass

    # For unsupported transitions, default to concatenation
    return concatenate_videoclips([clip1, clip2])

# Main program
if __name__ == "__main__":
    # Load video clips
    clip1 = VideoFileClip("server\output.mp4")
    clip2 = VideoFileClip(r"C:\Users\saedi\Music\temp\react-video-editor\server\u3jPWfBT7kjkhK2n.mp4")

    # Select a transition from the TRANSITIONS list
    selected_transition = {
        "id": "2",
        "kind": "slide",
        "duration": 1.0,  # Fade for 1 second
    }

    # Apply the selected transition
    final_clip = apply_transition(clip1, clip2, selected_transition)

    # Save the output video
    final_clip.write_videofile("output_with_transition.mp4", codec="libx264", audio_codec="aac")
