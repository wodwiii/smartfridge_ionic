import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonPopover,
  IonAlert,
} from "@ionic/react";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";
import { Storage } from "@ionic/storage";
import "./FridgeDetailsPage.css";
import axios from "axios";
import {
  create,
  fastFoodOutline,
  folderOpen,
  informationCircleOutline,
  informationCircleSharp,
  lockClosedOutline,
  lockClosedSharp,
  lockOpenOutline,
  lockOpenSharp,
  qrCode,
  qrCodeOutline,
  thermometer,
  thermometerOutline,
  thermometerSharp,
} from "ionicons/icons";
interface FridgeItem {
  _id: string;
  item_desc: {
    product_info:{
      price: number;
      product_desc: string;
      product_imgURL: string;
      product_class: string;
    },
    productName: string;
  };
  item_code: string;
}
interface FridgeDetailsPageProps
  extends RouteComponentProps<{ refID: string }> {}
const FridgeDetailsPage: React.FC<FridgeDetailsPageProps> = ({ match }) => {
  const history = useHistory();
  const refID = match.params.refID;
  const [fridgeDetails, setFridgeDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

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
    const fetchFridgeDetails = async () => {
      try {
        const response = await axios.get(
          `https://smart-fridge-server-whx4slgp5q-as.a.run.app/fridge/${refID}`,
          {
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          }
        );

        if (response.status === 200) {
          setFridgeDetails(response.data);
        } else {
          console.error("Error fetching fridge details:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching fridge details:", error);
      } finally {
        setLoading(false);
      }
    };
    if(authToken){
      fetchFridgeDetails();
    }
  }, [refID, authToken]);

  const getLatestTemperature = () => {
    if (
      fridgeDetails &&
      fridgeDetails.info &&
      fridgeDetails.info.info &&
      fridgeDetails.info.info.temperature
    ) {
      const temperatures = fridgeDetails.info.info.temperature;
      if (temperatures.length > 0) {
        const latestTemperature =
          temperatures[temperatures.length - 1].temperature;
        return latestTemperature;
      }
    }
    return null;
  };

  const getLatestLockState = () => {
    if (
      fridgeDetails &&
      fridgeDetails.info &&
      fridgeDetails.info.info &&
      fridgeDetails.info.info.lockstate
    ) {
      const lockStates = fridgeDetails.info.info.lockstate;
      return lockStates;
    }
    return null;
  };
  const handleFabClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmation = (confirmed: boolean) => {
    setShowConfirmation(false);
    if (confirmed) {
      buyItems();
    } else {
      console.log("Transaction cancelled");
    }
  };
  const buyItems = async () => {
    let paymentIntentId;
    if (fridgeDetails.status == "available") {
      if (!getLatestLockState().locked) {
        try {
          const response = await axios.post(
            `https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/hold-payment`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                "auth-token": authToken,
              },
            }
          );
          paymentIntentId = response.data.paymentIntent.id;
          console.log(paymentIntentId);
          history.push(`/buy-items/${refID}/${paymentIntentId}`);
        } catch (error) {
          alert(
            "Please ensure your account has a valid payment method."
          );
          console.error("Error while holding payment:", error);
        }
      } else {
        alert(
          "There are currently users buying items in this fridge. Please try again later."
        );
      }
    } else {
      alert("This fridge is currently unavailable. Please try again later.");
    }
  };
  return (
    <IonPage>
      <IonHeader className="fridgeheader">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color="primary"></IonBackButton>
          </IonButtons>
          <IonTitle className="headertitle">Fridge Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="padding">
        <IonLoading isOpen={loading} message="Loading..." />
        {fridgeDetails && (
          <div>
            <div className="headcontainer">
              <div className="headtitle">
                <h6 style={{ margin: 0 }}>{fridgeDetails.fridge_id}</h6>
                <h1 style={{ margin: 0 }}>{fridgeDetails.location}</h1>
                <p className="status">
                  <IonIcon
                    id="hover-trigger"
                    color="primary"
                    icon={informationCircleSharp}
                  />
                  {fridgeDetails.status}
                </p>
                <IonPopover trigger="hover-trigger" triggerAction="hover">
                  <IonContent class="ion-padding">
                    This refrigerator is currently unavailable.
                  </IonContent>
                </IonPopover>
              </div>
            </div>
                <h4>Available Products:</h4>
            {fridgeDetails.info.info.items_present.list.length > 0 && (
              <>
                <IonSegment
                  scrollable={true}
                  value="all"
                  className="sticky-segment"
                >
                  <IonSegmentButton value="all">All</IonSegmentButton>
                  <IonSegmentButton value="drinks">Drinks</IonSegmentButton>
                  <IonSegmentButton value="meals">Meals</IonSegmentButton>
                  <IonSegmentButton value="desserts">Desserts</IonSegmentButton>
                  <IonSegmentButton value="others">Others</IonSegmentButton>
                </IonSegment>
                <IonList lines="inset">
                  {fridgeDetails.info.info.items_present.list.map(
                    (item: FridgeItem) => (
                      <IonItem key={item._id}>
                        <IonIcon
                          aria-hidden="true"
                          icon={fastFoodOutline}
                          slot="end"
                          color="primary"
                        ></IonIcon>
                        <IonLabel>
                          <h1 className="itemcode">{item.item_code}</h1>
                          <h1 className="productname">
                            {item.item_desc.productName}
                          </h1>
                          <h1 className="price">${item.item_desc.product_info.price}</h1>
                        </IonLabel>
                      </IonItem>
                    )
                  )}
                </IonList>
              </>
            )}
          </div>
        )}
        <IonFab
          vertical="bottom"
          style={{
            position: "absolute",
            left: "80%",
            transform: "translate(-50%, -50%)",
          }}
          slot="fixed"
        >
          <IonFabButton onClick={handleFabClick}>
            <IonIcon size="large" icon={lockOpenSharp}></IonIcon>
          </IonFabButton>
        </IonFab>
        <IonAlert
          className="alert"
          isOpen={showConfirmation}
          onDidDismiss={() => setShowConfirmation(false)}
          header={"Confirm Transaction"}
          message={
            "Do you want to proceed opening the fridge? This action will hold $10 from your card."
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => handleConfirmation(false),
            },
            {
              text: "Confirm",
              handler: () => handleConfirmation(true),
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default FridgeDetailsPage;
