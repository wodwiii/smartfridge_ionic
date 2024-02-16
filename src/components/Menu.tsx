import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';

import { useLocation } from 'react-router-dom';
import { cardOutline, cardSharp, homeOutline, homeSharp, logOutOutline, logOutSharp, personOutline, personSharp, receiptOutline, receiptSharp, settingsOutline, settingsSharp, snowOutline, snowSharp } from 'ionicons/icons';
import './Menu.css';

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

const appPages: AppPage[] = [
  {
    title: 'Home',
    url: '/home',
    iosIcon: homeOutline,
    mdIcon: homeSharp
  },
  {
    title: 'Fridges',
    url: '/fridges',
    iosIcon: snowOutline,
    mdIcon: snowSharp
  },
  {
    title: 'Payment Methods',
    url: '/payment',
    iosIcon: cardOutline,
    mdIcon: cardSharp
  },
  {
    title: 'My Account',
    url: '/myaccount',
    iosIcon: personOutline,
    mdIcon: personSharp
  },
  {
    title: 'Settings',
    url: '/settings',
    iosIcon: settingsOutline,
    mdIcon: settingsSharp
  },
  {
    title: 'Logout',
    url: '/logout',
    iosIcon: logOutOutline,
    mdIcon: logOutSharp
  }
];



const Menu: React.FC = () => {
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="menu-list">
          <IonListHeader>Smart Fridge</IonListHeader>
          <IonNote>Get anything!</IonNote>
          {appPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={true}>
                <IonItem className={location.pathname === appPage.url ? 'selected' : ''} routerLink={appPage.url} routerDirection="none" lines="none" detail={false}>
                  <IonIcon aria-hidden="true" slot="start" ios={appPage.iosIcon} md={appPage.mdIcon} />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
