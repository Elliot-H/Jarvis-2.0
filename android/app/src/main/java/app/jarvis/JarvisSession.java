package app.jarvis;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;

/** Side-key / assistant gesture: open Jarvis over the lock screen and let him start listening. */
public class JarvisSession extends VoiceInteractionSession {
  JarvisSession(Context c) { super(c); }
  @Override public void onShow(Bundle args, int showFlags) {
    super.onShow(args, showFlags);
    Intent i = new Intent(getContext(), MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    startAssistantActivity(i);
    hide();
  }
}
