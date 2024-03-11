package com.smartfridge.SmartFridge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
     @Override
     public void onCreate(Bundle savedInstanceState) {
         super.onCreate(savedInstanceState);
         registerPlugin(com.getcapacitor.community.stripe.StripePlugin.class);
     }
}
