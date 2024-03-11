import React, { useEffect, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonHeader,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import axios from "axios";
import { Stripe, PaymentFlowEventsEnum } from "@capacitor-community/stripe";
import { CapacitorStripeProvider } from "@capacitor-community/stripe/dist/esm/react/provider";
import "./Payment.css";
import { Storage } from "@ionic/storage";

const Payment: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; brand: string; last4: string }[]
  >([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthToken = async () => {
      try {
        const store = new Storage();
        await store.create();
        const token = await store.get("auth-token");
        setAuthToken(token);
      } catch (error) {
        console.error("Error fetching auth token:", error);
      }
    };

    fetchAuthToken();
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get(
          "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/payment-methods",
          {
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          }
        );

        setPaymentMethods(response.data.paymentMethods || []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    if (authToken) {
      fetchPaymentMethods();
    }
  }, [authToken]);

  const handleSelectPaymentMethod = (id: string) => {
    setSelectedMethod(id);
  };

  const setDefaultPaymentMethod = async () => {
    try {
      if (selectedMethod) {
        await axios.post(
          "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/set-default",
          {
            pm_id: selectedMethod,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          }
        );        
        const updatedPaymentMethods = await axios.get(
          "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/payment-methods",
          {
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          }
        );
        setPaymentMethods(updatedPaymentMethods.data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
    }
  };
  const initializePaymentFlow = async () => {
    try {
      Stripe.addListener(PaymentFlowEventsEnum.Completed, () => {
        console.log("PaymentFlowEventsEnum.Completed");
      });

      const response = await axios.post(
        "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/payment-sheet",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
        }
      );

      console.log(response.data);

      Stripe.createPaymentFlow({
        setupIntentClientSecret: response.data.setupIntent,
        customerEphemeralKeySecret: response.data.ephmeralKey,
        customerId: response.data.customer,
        merchantDisplayName: "Smart Fridge",
      });

      const presentResult = await Stripe.presentPaymentFlow();
      console.log(presentResult);
      const confirmResult = await Stripe.confirmPaymentFlow();
      console.log(confirmResult);
    } catch (error) {
      console.error("Error initializing Payment Flow:", error);
    }
  };

  return (
    <CapacitorStripeProvider
      publishableKey="pk_test_51Ok3FTCxkfHrsM9FSKeGljifT8sHim7mZaoHzpqiNdmq9OrFKjRoX27HC3T9JNlWkCSPiWMGGzqAY0Yf8Z59C3dw00gz1HRFGL"
      fallback={<p>Loading...</p>}
    >
      <IonPage>
        <IonHeader className="paymentHeader">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton />
            </IonButtons>
            <IonTitle>Payment Methods</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            {paymentMethods.length === 0 ? (
              <p>No payment methods available.</p>
            ) : (
              paymentMethods.map((method) => (
                <IonCard
                  key={method.id}
                  onClick={() => handleSelectPaymentMethod(method.id)}
                  className={`payment-card ${
                    selectedMethod === method.id ? "selected" : ""
                  }`}
                >
                  <IonCardHeader>Type: {method.brand}</IonCardHeader>
                  <IonCardContent>
                    <p>Card Number: **** **** **** {method.last4}</p>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </IonList>
          <IonButton
            shape="round"
            onClick={setDefaultPaymentMethod}
            disabled={!selectedMethod}
          >
            Set Default
          </IonButton>
          <IonButton shape="round" onClick={initializePaymentFlow}>
            Add Card
          </IonButton>
        </IonContent>
      </IonPage>
    </CapacitorStripeProvider>
  );
};

export default Payment;
