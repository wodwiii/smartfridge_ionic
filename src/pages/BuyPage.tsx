import React, { useEffect, useState } from 'react';
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
  } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { Storage } from '@ionic/storage';

interface BuyPageProps extends RouteComponentProps<{ refID: string }> {}

const BuyPage: React.FC<BuyPageProps> = ({ match }) => {
  const refID = match.params.refID;
  const [itemList, setItemList] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Function to fetch data from the database
  const initialfetchDataFromDatabase = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get('auth-token');

      const response = await fetch(`http://localhost:3000/fridge/${refID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Assuming data has the 'info' object with 'items_present' property
        const itemListArray = data.info?.info?.items_present?.list || [];
        setItemList(itemListArray);
      } else {
        console.error('Error fetching fridge details:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const wsFetchDataFromDatabase = async (data: any) => {
    console.log('wsFetchDataFromDatabase called with data:', data);
    try {
      const itemCodes = data.data.item_list; // Assuming the data contains an array of item codes
      console.log('Item codes:', itemCodes);
  
      // Check if itemCodes is defined before attempting to map over it
      if (itemCodes && Array.isArray(itemCodes)) {
        const store = new Storage();
        await store.create();
        const authToken = await store.get('auth-token');
        const detailsPromises = itemCodes.map(async (itemCode: any) => {
          const response = await fetch(`http://localhost:3000/fridge/${refID}/${itemCode}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'auth-token': authToken,
            },
          });
  
          if (response.ok) {
            return response.json();
          } else {
            console.error(`Error fetching item details for ${itemCode}:`, response.statusText);
            return null;
          }
        });
  
        const updatedItemList = await Promise.all(detailsPromises);
        setItemList(updatedItemList.filter(item => item !== null)); // Filter out null values
      } else {
        console.error('Item codes are not defined or not an array:', itemCodes);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  useEffect(() => {
    // Fetch initial data from the database during component mount
    initialfetchDataFromDatabase();

    const newWs = new WebSocket('ws://localhost:3000');
    setWs(newWs);

    newWs.onopen = () => {
      console.log('WebSocket connection opened.');
    };

    newWs.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'itemChange') {
        wsFetchDataFromDatabase(data);
      }
    };
    newWs.onclose = () => {
      console.log('WebSocket connection closed.');
    };
    return () => {
      newWs.close();
    };
  }, [refID]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Buy Page for {refID}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {itemList.map((item) => (
            <IonItem key={item._id}>
              <IonLabel>
                <h3>{item.item_desc.item_name}</h3>
                <p>Price: {item.item_desc.price}</p>
                <p>Item Code: {item.item_code}</p>
                {/* Add more details as needed */}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default BuyPage;
