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
} from "@ionic/react";
import { RouteComponentProps, useHistory } from "react-router-dom";
import moment from "moment";
import { Storage } from "@ionic/storage";
import "./FridgeDetailsPage.css";
import { create, qrCodeOutline } from "ionicons/icons";
interface FridgeItem {
  _id: string;
  item_desc: {
    item_name: string;
    price: number;
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

  useEffect(() => {
    const fetchFridgeDetails = async () => {
      try {
        // Get auth-token from storage
        const store = new Storage();
        await store.create();
        const authToken = await store.get("auth-token");

        if (!authToken) {
          history.push("/login");
          return;
        }
        const response = await fetch(`http://localhost:3000/fridge/${refID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFridgeDetails(data);
        } else {
          console.error("Error fetching fridge details:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching fridge details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFridgeDetails();
  }, [refID]);

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
      if (lockStates.length > 0) {
        const latestLockState = lockStates[lockStates.length - 1];
        return latestLockState;
      } else {
        return lockStates[0];
      }
    }
    return null;
  };
  const buyItems = () => {
    if(fridgeDetails.status == "available"){
        if(getLatestLockState().locked){
            history.push(`/buy-items/${refID}`);
        }
        else{
            alert("There are currently users buying items in this fridge. Please try again later.");
        }
    }
    else{
        alert("This fridge is currently unavailable. Please try again later.");
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>Fridge Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="Loading..." />
        {fridgeDetails && (
          <div>
            <div className="headcontainer">
              <div className="headtitle">
                <h6 style={{ margin: 0 }}>{fridgeDetails.fridge_id}</h6>
                <h1 style={{ margin: 0 }}>{fridgeDetails.location}</h1>
              </div>
              <div className="qrbtn">
                  <IonButton fill="outline" onClick={buyItems}>
                    <IonIcon slot="icon-only" icon={qrCodeOutline} size="large"></IonIcon>
                  </IonButton>
              </div>
            </div>
            <p>Status: {fridgeDetails.status}</p>
            <p>Latest Temperature: {getLatestTemperature()} °C</p>
            {getLatestLockState() && (
              <>
                <p>Lock State:</p>
                <p>
                  Timestamp:{" "}
                  {moment(getLatestLockState().timestamp).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </p>
                <p>Locked: {getLatestLockState().locked ? "Yes" : "No"}</p>
                <p>Executed By: {getLatestLockState().executed_by}</p>
              </>
            )}

            {fridgeDetails.info.info.items_present.list.length > 0 && (
              <>
                <p>Present Items:</p>
                <ul>
                  {fridgeDetails.info.info.items_present.list.map(
                    (item: FridgeItem) => (
                      <li key={item._id}>
                        <p>Item Name: {item.item_desc.item_name}</p>
                        <p>Price: {item.item_desc.price}</p>
                        <p>Item Code: {item.item_code}</p>
                        {/* Add more details as needed */}
                      </li>
                    )
                  )}
                </ul>
              </>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default FridgeDetailsPage;
