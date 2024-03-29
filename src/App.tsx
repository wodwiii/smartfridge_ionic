import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";
import Menu from "./components/Menu";
import Home from "./pages/Home";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import LoginPage from "./pages/LoginPage";
import { useEffect, useState } from "react";
import { Storage } from "@ionic/storage";
import FridgeDetailsPage from "./pages/FridgeDetailsPage";
import BuyPage from "./pages/BuyPage";
import Payment from "./pages/Payment";
import { StatusBar } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { Stripe } from "@capacitor-community/stripe";
setupIonicReact();

const LogoutRoute: React.FC = () => {
  useEffect(() => {
    const logout = async () => {
      console.log("Logout...");
      const storage = new Storage();
      await storage.create();
      await storage.remove("auth-token");
      window.location.href = "/login";
    };
    logout();
  }, []);
  return null;
};

const App: React.FC = () => {
  Stripe.initialize({
    publishableKey:
      "pk_test_51Ok3FTCxkfHrsM9FSKeGljifT8sHim7mZaoHzpqiNdmq9OrFKjRoX27HC3T9JNlWkCSPiWMGGzqAY0Yf8Z59C3dw00gz1HRFGL",
  });

  const [authCode, setAuthCode] = useState<string | null>(null);

  useEffect(() => {
    StatusBar.hide();
    const initializeStorage = async () => {
      const store = new Storage();
      await store.create();
      const cachedAuthCode = await store.get("auth-token");
      if (cachedAuthCode) {
        setAuthCode(cachedAuthCode);
      }
    };

    initializeStorage();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <Menu />
        <IonSplitPane contentId="main">
          <IonRouterOutlet id="main">
            <Route path="/" exact={true}>
              {authCode ? <Redirect to="/home" /> : <LoginPage />}
            </Route>
            <Route path="/home" exact={true}>
              <Home />
            </Route>
            <Route path="/login" exact={true}>
              <LoginPage />
            </Route>
            <Route
              path="/fridge-details/:refID"
              component={FridgeDetailsPage}
            />
            <Route path="/buy-items/:refID/:paymentIntentId" component={BuyPage} />
            <Route path="/logout" component={LogoutRoute} />
            <Route path="/payment" component={Payment} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
