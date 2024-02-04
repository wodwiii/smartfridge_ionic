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
} from "@ionic/react";
import { RouteComponentProps, useHistory, withRouter } from "react-router-dom";
import moment from "moment";
import { Storage } from "@ionic/storage";
import "./FridgeDetailsPage.css";
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
        const response = await fetch(
          `https://infinite-byte-413002.as.r.appspot.com/fridge/${refID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          }
        );

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
    if (fridgeDetails.status == "available") {
      if (getLatestLockState().locked) {
        history.push(`/buy-items/${refID}`);
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

            {fridgeDetails.info.info.items_present.list.length > 0 && (
              <>
                <h4>Available Products:</h4>
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
                            {item.item_desc.item_name}
                          </h1>
                          <h1 className="price">${item.item_desc.price}</h1>
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
          <IonFabButton onClick={buyItems}>
            <IonIcon size="large" icon={lockOpenSharp}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default FridgeDetailsPage;
