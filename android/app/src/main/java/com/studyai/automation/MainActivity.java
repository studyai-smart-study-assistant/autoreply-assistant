package com.studyai.automation;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AutoReplyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
