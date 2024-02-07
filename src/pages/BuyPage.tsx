import React, { useEffect, useState } from "react";
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
} from "@ionic/react";
import { RouteComponentProps } from "react-router-dom";
import { Storage } from "@ionic/storage";
import "./BuyPage.css";
import { checkmark, fastFoodOutline, lockOpenSharp } from "ionicons/icons";
interface BuyPageProps extends RouteComponentProps<{ refID: string }> {}

const BuyPage: React.FC<BuyPageProps> = ({ match }) => {
  const refID = match.params.refID;
  const [itemList, setItemList] = useState<any[]>([]);
  const [takenItems, setTakenItems] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFabClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmation = (confirmed: boolean) => {
    setShowConfirmation(false);

    if (confirmed) {
      console.log('Transaction confirmed');
    } else {
      console.log('Transaction cancelled');
    }
  };

  // Function to fetch data from the database
  const initialfetchDataFromDatabase = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
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
                `https://infinite-byte-413002.as.r.appspot.com/fridge/${refID}/${item.item_code}`,
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
    initialfetchDataFromDatabase();
    const newWs = new WebSocket("ws://infinite-byte-413002.as.r.appspot.com");
    setWs(newWs);

    newWs.onopen = () => {
      console.log("WebSocket connection opened.");
    };

    newWs.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      const data = JSON.parse(event.data);
      if (data.type === "itemChange") {
        wsFetchDataFromDatabase(data);
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
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
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
                        {item.item_desc.item_name}
                      </h1>
                      <h1 className="price">${item.item_desc.price}</h1>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonFab
          vertical="bottom"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          slot="fixed"
        >
          <IonFabButton onClick={handleFabClick}>
            <IonIcon size="large" icon={checkmark}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
      <IonAlert className="alert"
        isOpen={showConfirmation}
        onDidDismiss={() => setShowConfirmation(false)}
        header={'Confirm Transaction'}
        message={'Do you want to proceed with your purchase?'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => handleConfirmation(false),
          },
          {
            text: 'Confirm',
            handler: () => handleConfirmation(true),
          },
        ]}
      />
    </IonPage>
  );
};

export default BuyPage;
