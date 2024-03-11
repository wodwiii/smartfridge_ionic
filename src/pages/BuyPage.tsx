import React, { useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardContent,
  IonAlert,
  IonButton,
} from "@ionic/react";
import { RouteComponentProps, useHistory } from "react-router-dom";
import { Storage } from "@ionic/storage";
import "./BuyPage.css";
import { checkmark, fastFoodOutline, lockOpenSharp } from "ionicons/icons";
import axios from "axios";
interface BuyPageProps
  extends RouteComponentProps<{ refID: string; paymentIntentId: string }> {}

const BuyPage: React.FC<BuyPageProps> = ({ match }) => {
  const refID = match.params.refID;
  const paymentIntentId = match.params.paymentIntentId;
  const history = useHistory();
  const [itemList, setItemList] = useState<any[]>([]);
  const [takenItems, setTakenItems] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const totalPriceRef = useRef<number>(0);
  const initialfetchDataFromDatabase = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
      const response = await fetch(
        `https://smart-fridge-server-whx4slgp5q-as.a.run.app/fridge/${refID}`,
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
        const itemListArray = data.info?.info?.items_present?.list || [];
        console.log("Initial items present:", itemListArray);
        setItemList(itemListArray);
      } else {
        console.error("Error fetching fridge details:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const wsFetchDataFromDatabase = async (data: any) => {
    console.log("wsFetchDataFromDatabase called with data:", data);
    try {
      const itemCodes = data.data.item_list;
      console.log("Item codes:", itemCodes);
      setItemList((prevItemList) => {
        console.log("Initial Item codes:", prevItemList);
        const takenItemsArray = prevItemList.filter(
          (item) => !itemCodes.includes(item.item_code)
        );
        console.log("items removed: ", takenItemsArray);
        if (takenItemsArray && Array.isArray(takenItemsArray)) {
          const store = new Storage();
          store.create().then(async () => {
            const authToken = await store.get("auth-token");
            const detailsPromises = takenItemsArray.map(async (item: any) => {
              const response = await fetch(
                `https://smart-fridge-server-whx4slgp5q-as.a.run.app/fridge/${refID}/${item.item_code}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "auth-token": authToken,
                  },
                }
              );

              if (response.ok) {
                return response.json();
              } else {
                console.error(
                  `Error fetching item details for ${item}:`,
                  response.statusText
                );
                return null;
              }
            });
            const updatedItemList = await Promise.all(detailsPromises);
            console.log("Taken items number: " + updatedItemList.length);
            setTakenItems(updatedItemList.filter((item) => item !== null)); // Update taken items
          });
        } else {
          console.error(
            "Item codes are not defined or not an array:",
            itemCodes
          );
        }
        return prevItemList;
      });
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };

  useEffect(() => {
    const calculateTotalPrice = () => {
      const totalPriceSum = takenItems.reduce((acc, item) => {
        return acc + item.item_desc.product_info.price;
      }, 0);
      setTotalPrice(totalPriceSum);
      totalPriceRef.current = totalPriceSum;
    };

    calculateTotalPrice();
  }, [takenItems]);

  const capturePayment = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
      console.log(totalPriceRef.current);
      const response = await axios.post(
        "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/capture-payment",
        {
          pi_id: paymentIntentId,
          amount: totalPriceRef.current * 100,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
        }
      );
      if (response.data === "Payment successfully captured") {
        console.log("Payment successfully captured");
      } else {
        console.error("Error capturing payment:", response.data);
      }
    } catch (error) {
      console.error("Error capturing payment:", error);
    }
  };
  const cancelPayment = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
      const response = await axios.post(
        "https://smart-fridge-server-whx4slgp5q-as.a.run.app/payment/cancel-payment",
        {
          pi_id: paymentIntentId
        },
        {
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
        }
      );
      if (response.data === "Transaction has been cancelled") {
        console.log("Transaction has been cancelled");
      } else {
        console.error("Error cancelling payment:", response.data);
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);
    }
  };
  useEffect(() => {
    initialfetchDataFromDatabase();
    const newWs = new WebSocket("ws://smart-fridge-server-whx4slgp5q-as.a.run.app");
    setWs(newWs);
    newWs.onopen = () => {
      newWs.send(JSON.stringify({ type: "subscribe", refID: refID }));
      console.log("WebSocket connection opened.");
    };
    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "itemChange") {
        if (data.data.fridge_id === refID) {
          wsFetchDataFromDatabase(data);
        } else {
          console.log("data is not for you");
        }
      }
      if (
        data.type === "lockstateUpdate" &&
        data.data.fridge_id === refID &&
        data.data.locked === "False"
      ) {
        try {
          capturePayment();
          setShowAlert(true);
          // if (takenItems.length > 0) {
          //   capturePayment();
          //   setShowAlert(true);
          // } else {
          //   cancelPayment();
          // }
          history.push("/");
        } catch (error) {
          console.error("Error capturing payment:", error);
        }
      }
    };
    newWs.onclose = () => {
      console.log("WebSocket connection closed.");
    };
    return () => {
      newWs.close();
    };
  }, [refID]);

  return (
    <IonPage>
      <IonHeader className="checkoutHeader">
        <IonToolbar>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="paddingcheckout">
        <IonCard>
          <IonCardContent>
            {takenItems.length === 0 ? (
              <p>Items taken will be displayed here.</p>
            ) : (
              <IonList lines="inset">
                {takenItems.map((item) => (
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
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
        {takenItems.length > 0 && (
          <div className="totalPrice">
            <p>Total Price of Items Taken: ${totalPrice.toFixed(2)}</p>
          </div>
        )}
        {/* <IonButton onClick={capturePayment}>Capture</IonButton> */}
      </IonContent>
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={"Transaction Completed"}
        message={"Your transaction has been successfully completed."}
        buttons={["OK"]}
      />
    </IonPage>
  );
};

export default BuyPage;
