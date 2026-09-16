export type TravelVideo = {
  videoId: string;
  title: string;
  creator: string;
  state: string;
  place?: string;
};

const video = (videoId: string, title: string, creator: string, state: string, places: string[]) => places.map((place) => ({ videoId, title, creator, state, place }));

export const travelVideos: TravelVideo[] = [
  ...video('PR8NA6qqbdk', 'New Delhi India Travel Guide: Best Things To Do in Delhi', 'Island Hopper TV', 'Delhi', ['Old Delhi','India Gate','Red Fort','Qutub Minar',"Humayun's Tomb",'Lotus Temple','Akshardham','Lodhi Garden','Jama Masjid','National Museum','Hauz Khas','Purana Qila']),
  ...video('RxwFb5dnWzg', 'Mumbai India Travel Guide 4K', 'Island Hopper TV', 'Maharashtra', ['Mumbai']),
  ...video('665AHTNpf2o', 'Taj Mahal, Agra, India [Amazing Places 4K]', 'Amazing Places on Our Planet', 'Uttar Pradesh', ['Agra','Fatehpur Sikri']),
  ...video('PvpLdqJ5co4', 'Varanasi, India - Travel Guide and Top Things To Do', 'Mark Wiens', 'Uttar Pradesh', ['Varanasi','Sarnath']),
  ...video('gIIm4dh5aKE', 'Goa India Travel Guide 4K', 'Island Hopper TV', 'Goa', ['North Goa','South Goa','Dudhsagar Falls','Panaji','Old Goa','Palolem','Agonda','Anjuna','Calangute','Baga','Chapora']),
  ...video('rdKpptxCCYw', 'Jaipur, Rajasthan | cinematic 4k travel video | INDIA', 'Rohan Katwe', 'Rajasthan', ['Jaipur']),
  ...video('d7TwL-tsC2Q', 'Complete Travel Guide to Udaipur', 'Anuj Bucket', 'Rajasthan', ['Udaipur']),
  ...video('U7NGuD1TAok', 'Complete travel guide Amritsar', 'Anuj Bucket', 'Punjab', ['Amritsar','Wagah Border']),
  ...video('S_dpPS4Vvcs', 'Complete travel guide Manali', 'Anuj Bucket', 'Himachal Pradesh', ['Manali']),
  ...video('YTzvifuz_Qg', 'Ladakh in 4K | Complete Travel Guide', 'TRAVERART', 'Ladakh', ['Leh','Pangong Lake','Nubra Valley','Khardung La','Tso Moriri','Kargil','Zanskar','Lamayuru','Alchi','Hemis','Thiksey','Turtuk','Hanle']),
  ...video('0z6wjksldpQ', 'MUNNAR... Everything You Should Know..', 'Traveling Desi', 'Kerala', ['Munnar']),
  ...video('Gdfay74-Eaw', 'Watch This Guide Before Going To Rishikesh', 'Xplore The Earth', 'Uttarakhand', ['Rishikesh']),
  ...video('3_txxnLvUNg', 'Tirupati Travel Vlog', 'Ram The Traveller', 'Andhra Pradesh', ['Tirupati']),
  ...video('eNWkPxMq0CQ', 'Complete Travel Guide to Puri, Bhubaneswar & Konark', 'Anuj Bucket', 'Odisha', ['Puri','Konark','Bhubaneswar']),
  ...video('eT3loP_vM68', 'Shillong - Meghalaya Complete Travel Guide', 'DocTourer Shashvat', 'Meghalaya', ['Shillong','Cherrapunji','Dawki']),
];

export function getPlaceVideo(state: string, place: string) {
  return travelVideos.find((video) => video.state === state && video.place?.toLowerCase() === place.toLowerCase());
}

export function getStateVideo(state: string) {
  return travelVideos.find((video) => video.state === state);
}
