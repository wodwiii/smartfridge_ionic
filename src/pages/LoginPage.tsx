import { IonButton, IonContent, IonInput, IonLoading } from "@ionic/react";
import React, { useState } from "react";
import { Storage } from '@ionic/storage';

import "./LoginPage.css";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const store = new Storage();
      await store.create();
      // Make an API call for authentication
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const authTokenFromHeaders = response.headers.get('auth-token');
        const authTokenFromBody = await response.text();
        const authToken = authTokenFromHeaders || authTokenFromBody;
        if (authToken) {
          await store.set('auth-token', authToken);
          console.log('Auth Token:', authToken);
        } else {
          console.error('Auth token not found in headers or body');
        }
      } else {
        console.error('Authentication failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonContent className="ion-padding">
      <div className="container">
        <h1 className="title">Login</h1>
        <IonInput
          value={username}
          onIonChange={(e) => setUsername(e.detail.value!)}
          className="custom-input"
          label="Username"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter text"
        ></IonInput>
        <IonInput
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
          className="custom-input"
          label="Password"
          labelPlacement="floating"
          type="password"
          fill="outline"
          placeholder="Enter text"
        ></IonInput>
        <div className="button">
          <IonButton
            shape="round"
            onClick={handleLogin}
            disabled={isLoading}
            className="custom-button"
          >
            Login
          </IonButton>
        </div>
        <IonLoading isOpen={isLoading} message="Logging in..." />
      </div>
    </IonContent>
  );
};

export default LoginPage;
