 export interface  CardData {
   title: string;
   data: number;
   count: number;
   icon: string;
   color: string;
 }
 

export interface Match {
  declared: boolean;
  gameId: any;
  _id: string;
  eventName: string;
  eventTime: string;
}