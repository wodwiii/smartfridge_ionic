import {  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonList, IonLoading, IonMenuButton,  IonPage, IonSearchbar, IonToolbar,} from '@ionic/react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router-dom';
import './Home.css';
import { useEffect, useState } from 'react';
import { Storage } from '@ionic/storage';
import { caretForward, chevronForwardCircle, locationSharp, logoIonic, storefront } from 'ionicons/icons';

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
        const response = await fetch('https://infinite-byte-413002.as.r.appspot.com/fridge/list', {
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
      <div className="header">
      <IonToolbar class="customToolbar">
        <IonButtons class="customMenu" slot="start">
          <IonMenuButton  autoHide={true}></IonMenuButton>
        </IonButtons>
      </IonToolbar>
      <IonToolbar class="customToolbar">
      <IonSearchbar  placeholder="Search for smart fridge" class="customSearch"></IonSearchbar>
      </IonToolbar>
      </div> 

      <IonContent>
        <IonLoading isOpen={loading} message="Loading..." />
        <IonList>
          {fridges.map((fridge) => (
            <IonCard key={fridge._id} onClick={() => handleCardClick(fridge.fridge_id)}>
            <IonCardHeader>
              
              <IonCardSubtitle>{fridge.fridge_id}</IonCardSubtitle>
              <div className="fridgeTitle">
                <div className="loc">
                <IonCardTitle><IonIcon icon={locationSharp} size="large" color='primary'></IonIcon>{fridge.location}</IonCardTitle>
                </div>
                <div className="nextBtn">
                <IonIcon icon={chevronForwardCircle} size="large" color='primary'></IonIcon>
                </div>
              </div>
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
