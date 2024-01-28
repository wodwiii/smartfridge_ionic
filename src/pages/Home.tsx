import {  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonList, IonLoading, IonMenuButton,  IonPage, IonSearchbar,} from '@ionic/react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router-dom';
import './Home.css';
import { useEffect, useState } from 'react';
import { Storage } from '@ionic/storage';

const Home: React.FC<RouteComponentProps> = ({ history }) => {

  const [fridges, setFridges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const store = new Storage();
        await store.create();
        const authToken = await store.get('auth-token');
        console.log('Auth Code:', authToken);
        if (!authToken) {
          setRedirectToLogin(true);
          return;
        }
        const response = await fetch('http://localhost:3000/fridge/list', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFridges(data);
        } else {
          console.error('Error fetching data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (redirectToLogin) {
    return <Redirect to="/login" />;
  }

  const handleCardClick = (refID: string) => {
    history.push(`/fridge-details/${refID}`);
  };

  return (
    <IonPage>
        <IonButtons slot="start">
          <IonMenuButton autoHide={true}></IonMenuButton>
        </IonButtons>

      <IonContent>
        <IonSearchbar placeholder="Search for smart fridge"></IonSearchbar>
        <IonLoading isOpen={loading} message="Loading..." />
        <IonList>
          {fridges.map((fridge) => (
            <IonCard key={fridge._id} onClick={() => handleCardClick(fridge.fridge_id)}>
            <IonCardHeader>
              <IonCardSubtitle>{fridge.fridge_id}</IonCardSubtitle>
              <IonCardTitle>{fridge.location}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Status: {fridge.status}</p>
            </IonCardContent>
          </IonCard>
          ))}
        </IonList>
      </IonContent>

    </IonPage>
  );
};

export default withRouter(Home);
