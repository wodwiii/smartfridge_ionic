import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonToolbar,
} from "@ionic/react";
import { Redirect, RouteComponentProps, withRouter } from "react-router-dom";
import "./Home.css";
import { useEffect, useState } from "react";
import { Storage } from "@ionic/storage";
import {
  appsSharp,
  chevronForwardCircle,
  heartSharp,
  locationSharp,
  notificationsCircleSharp,
  qrCode,
} from "ionicons/icons";

const Home: React.FC<RouteComponentProps> = ({ history }) => {
  const [fridges, setFridges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({});
  const [showResultsModal, setShowResultsModal] = useState(false);

  const fetchData = async () => {
    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
      console.log("Auth Code:", authToken);
      if (!authToken) {
        setRedirectToLogin(true);
        return;
      }
      const response = await fetch(
        "https://infinite-byte-413002.as.r.appspot.com/fridge/list",
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
        setFridges(data);
      } else {
        console.error("Error fetching data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = async (ev: CustomEvent) => {
    let query = "";
    const target = ev.target as HTMLIonSearchbarElement;
    if (target) query = target.value!.toLowerCase();
    setSearchQuery(query);

    try {
      const store = new Storage();
      await store.create();
      const authToken = await store.get("auth-token");
      console.log("Auth Code:", authToken);
      if (!authToken) {
        setRedirectToLogin(true);
        return;
      }

      let url = "https://infinite-byte-413002.as.r.appspot.com/fridge";
      if (query) {
        url += `/${query}`;
        console.log("searching on:" + url);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setSearchResults(data);
        } else {
          console.error("Error fetching search results:", response.statusText);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const doRefresh = async (event: CustomEvent) => {
    await fetchData();
    event.detail.complete();
  };

  if (redirectToLogin) {
    return <Redirect to="/login" />;
  }

  const handleSearchClick = (refID: string) => {
    history.push(`/fridge-details/${refID}`);
  };

  const handleCardClick = (refID: string) => {
    history.push(`/fridge-details/${refID}`);
  };

  return (
    <IonPage>
      <div className="header">
        <IonToolbar class="customToolbar">
          <div className="homeheader">
            <div className="menuloc">
              <IonButtons class="customMenu" slot="start">
                <IonMenuButton autoHide={true}>
                  <IonIcon icon={appsSharp}></IonIcon>
                </IonMenuButton>
                <div className="location">
                  <h5 className="mainloc">Home</h5>
                  <h6 className="subloc">60 Luna St</h6>
                </div>
              </IonButtons>
            </div>
            <div className="notif">
              <IonIcon icon={heartSharp} className="hearticon"></IonIcon>
              <IonIcon
                icon={notificationsCircleSharp}
                className="notificon"
              ></IonIcon>
            </div>
          </div>
        </IonToolbar>
        <IonToolbar class="customToolbar">
          <IonSearchbar
            debounce={1000}
            value={searchQuery}
            onIonInput={(ev) => handleInput(ev)}
            placeholder="Search for smart fridge"
            class="customSearch"
          ></IonSearchbar>
          <IonList>
            {searchResults && Object.keys(searchResults).length > 0 && (
              <IonItem
                className="search"
                key={searchResults.fridge_id}
                onClick={() => handleSearchClick(searchResults.fridge_id)}
              >
                  <IonLabel>{searchResults.fridge_id}-{searchResults.location}</IonLabel>
                  <p>{searchResults.status}</p>
                  <IonIcon
                      icon={chevronForwardCircle}
                      size="small"
                      color="primary"
                    ></IonIcon>
              </IonItem>
            )}
          </IonList>
        </IonToolbar>
      </div>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonLoading isOpen={loading} message="Loading..." />
        <IonList>
          {fridges.map((fridge) => (
            <IonCard
              key={fridge._id}
              onClick={() => handleCardClick(fridge.fridge_id)}
            >
              <IonCardHeader>
                <IonCardSubtitle>{fridge.fridge_id}</IonCardSubtitle>
                <div className="fridgeTitle">
                  <div className="loc">
                    <IonCardTitle>
                      <IonIcon
                        icon={locationSharp}
                        size="large"
                        color="primary"
                      ></IonIcon>
                      {fridge.location}
                    </IonCardTitle>
                  </div>
                  <div className="nextBtn">
                    <IonIcon
                      icon={chevronForwardCircle}
                      size="large"
                      color="primary"
                    ></IonIcon>
                  </div>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p>Status: {fridge.status}</p>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
        <IonFab
          vertical="bottom"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          slot="fixed"
        >
          <IonFabButton>
            <IonIcon size="large" icon={qrCode}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default withRouter(Home);
