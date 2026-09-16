export type Place = { name: string; city: string; category: string; emoji: string; tone: string; description: string };
export type StateData = { name: string; places: Place[] };

const placeNames: Record<string, string[]> = {
  'Andhra Pradesh': ['Tirupati','Visakhapatnam','Araku Valley','Vijayawada','Amaravati','Gandikota','Lepakshi','Srisailam','Rajahmundry','Horsley Hills','Papikondalu'],
  'Arunachal Pradesh': ['Tawang','Ziro Valley','Bomdila','Dirang','Sela Pass','Mechuka','Namdapha','Itanagar','Pasighat','Aalo','Nameri'],
  'Assam': ['Kaziranga','Majuli','Guwahati','Sivasagar','Manas National Park','Tezpur','Haflong','Dibrugarh','Jorhat','Sualkuchi','Pobitora'],
  'Bihar': ['Bodh Gaya','Rajgir','Nalanda','Patna','Vaishali','Pawapuri','Valmiki National Park','Madhubani','Munger','Sasaram','Vikramshila'],
  'Chhattisgarh': ['Chitrakote Falls','Tirathgarh Falls','Barnawapara','Kanger Valley','Jagdalpur','Sirpur','Bhoramdeo','Mainpat','Amarkantak','Dongargarh','Raipur'],
  'Goa': ['North Goa','South Goa','Dudhsagar Falls','Panaji','Old Goa','Palolem','Agonda','Anjuna','Calangute','Baga','Chapora'],
  'Gujarat': ['Rann of Kutch','Somnath','Dwarka','Gir National Park','Ahmedabad','Statue of Unity','Dholavira','Modhera','Patan','Saputara','Champaner'],
  'Haryana': ['Sultanpur National Park','Kurukshetra','Pinjore','Morni Hills','Panchkula','Panipat','Hisar','Sohna','Faridabad','Surajkund','Kalesar'],
  'Himachal Pradesh': ['Manali','Shimla','Spiti Valley','Dharamshala','McLeod Ganj','Kasol','Kullu','Kinnaur','Dalhousie','Chamba','Khajjiar','Kasauli'],
  'Jharkhand': ['Deoghar','Hundru Falls','Dassam Falls','Netarhat','Betla National Park','Ranchi','Jamshedpur','Hazaribagh','Parasnath','Rajrappa','Patratu'],
  'Karnataka': ['Hampi','Mysuru','Coorg','Bengaluru','Gokarna','Chikmagalur','Badami','Pattadakal','Aihole','Jog Falls','Udupi','Kabini'],
  'Kerala': ['Munnar','Alappuzha','Kochi','Wayanad','Kovalam','Varkala','Thekkady','Kumarakom','Bekal','Kozhikode','Thrissur','Vagamon'],
  'Madhya Pradesh': ['Khajuraho','Kanha','Bandhavgarh','Sanchi','Orchha','Pachmarhi','Ujjain','Gwalior','Bhopal','Indore','Mandu','Panna','Amarkantak'],
  'Maharashtra': ['Mahabaleshwar','Ajanta Caves','Ellora Caves','Mumbai','Pune','Lonavala','Matheran','Nashik','Shirdi','Tadoba','Alibaug','Kolhapur'],
  'Manipur': ['Loktak Lake','Keibul Lamjao','Imphal','Ukhrul','Andro','Moirang','Shirui Hills','Moreh','Kakching','Thoubal'],
  'Meghalaya': ['Cherrapunji','Shillong','Mawlynnong','Dawki','Nongriat','Jowai','Nongpoh','Mawsynram','Shnongpdeng','Laitlum','Tura'],
  'Mizoram': ['Aizawl','Phawngpui','Champhai','Lunglei','Serchhip','Reiek','Hmuifang','Thenzawl','Durtlang','Vantawng Falls'],
  'Nagaland': ['Kohima','Dzukou Valley','Dimapur','Khonoma','Longwa','Wokha','Mon','Mokokchung','Tuophema','Japfu Peak'],
  'Odisha': ['Puri','Konark','Bhubaneswar','Chilika Lake','Cuttack','Gopalpur','Simlipal','Bhitarkanika','Raghurajpur','Dhauli','Barabati','Chandipur'],
  'Punjab': ['Amritsar','Anandpur Sahib','Patiala','Ludhiana','Jalandhar','Wagah Border','Bathinda','Pathankot','Kapurthala','Fatehgarh Sahib','Dharamkot'],
  'Rajasthan': ['Jaipur','Jaisalmer','Udaipur','Jodhpur','Pushkar','Mount Abu','Bikaner','Ranthambore','Chittorgarh','Kumbhalgarh','Bundi','Alwar','Deeg'],
  'Sikkim': ['Gangtok','Pelling','Lachen','Lachung','Nathula Pass','Yuksom','Namchi','Ravangla','Zuluk','Aritar'],
  'Tamil Nadu': ['Madurai','Ooty','Chennai','Mahabalipuram','Kodaikanal','Rameswaram','Thanjavur','Kanyakumari','Coimbatore','Yercaud','Kumbakonam','Hogenakkal'],
  'Telangana': ['Hyderabad','Warangal','Bhongir','Nizamabad','Karimnagar','Medak','Nagarjuna Sagar','Basara','Vemulawada','Adilabad'],
  'Tripura': ['Agartala','Neermahal','Unakoti','Udaipur','Jampui Hills','Sepahijala','Dumboor Lake','Kailashahar','Pilak'],
  'Uttar Pradesh': ['Varanasi','Agra','Ayodhya','Mathura-Vrindavan','Prayagraj','Lucknow','Sarnath','Kushinagar','Chitrakoot','Jhansi','Meerut','Dudhwa','Vindhyachal','Fatehpur Sikri','Sravasti'],
  'Uttarakhand': ['Kedarnath','Nainital','Rishikesh','Haridwar','Mussoorie','Badrinath','Valley of Flowers','Auli','Jim Corbett','Dehradun','Almora','Pithoragarh','Chopta','Mana'],
  'West Bengal': ['Darjeeling','Sundarbans','Kolkata','Kalimpong','Digha','Siliguri','Murshidabad','Bishnupur','Shantiniketan','Jalpaiguri','Koch Bihar','Mirik'],
  'Andaman & Nicobar Islands': ['Havelock Island','Port Blair','Neil Island','Ross Island','Baratang','North Bay','Long Island','Great Nicobar'],
  'Chandigarh': ['Rock Garden','Sukhna Lake','Rose Garden','Capitol Complex','Sector 17 Plaza','Government Museum','Terraced Garden'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Diu','Daman','Silvassa','Dudhni','Nagoa Beach','Devka Beach','Jampore Beach','Diu Fort','Naida Caves'],
  'Delhi': ['Old Delhi','India Gate','Red Fort','Qutub Minar',"Humayun's Tomb",'Lotus Temple','Akshardham','Lodhi Garden','Jama Masjid','National Museum','Hauz Khas','Purana Qila'],
  'Jammu & Kashmir': ['Srinagar','Gulmarg','Pahalgam','Sonamarg','Doodhpathri','Gurez Valley','Jammu','Patnitop','Doda','Akhnoor','Mansar','Vaishno Devi'],
  'Ladakh': ['Leh','Pangong Lake','Nubra Valley','Khardung La','Tso Moriri','Kargil','Zanskar','Lamayuru','Alchi','Hemis','Thiksey','Turtuk','Hanle'],
  'Lakshadweep': ['Agatti','Bangaram','Kavaratti','Kalpeni','Kadmat','Minicoy','Bangaram Atoll','Thinnakara'],
  'Puducherry': ['Puducherry','Auroville','Paradise Beach','Promenade Beach','White Town','Arikamedu','Mahe','Yanam','Karaikal'],
};

const categoryFor = (name: string, index: number) => {
  const n = name.toLowerCase();
  if (/temple|tirupati|srisailam|somnath|dwarka|kurukshetra|amritsar|anandpur|madurai|rameswaram|thanjavur|ayodhya|varanasi|sarnath|kushinagar|kedarnath|badrinath|haridwar|vaishno|deoghar|puri|konark|akshardham|jama masjid|shirdi|basara|vemulawada|udaipur|pushkar|unakoti|pattadakal|lepakshi|bodh gaya|nalanda|pawapuri|vikramshila|sanchi|khajuraho|orchha|maheshwar|omkareshwar/.test(n)) return 'Bhakti';
  if (/national park|wildlife|kaziranga|manas|pobitora|gir national|betla|kanha|bandhavgarh|panna|tadoba|keibul|simlipal|bhitarkanika|sundarbans|ranthambore|corbett|dudhwa|kalesar|sultanpur/.test(n)) return 'Wildlife';
  if (/beach|goa|coast|island|alappuzha|kovalam|varkala|gopalpur|digha|andaman|lakshadweep|diu|daman|nagoa|devka|jampore|alibaug|gokarna|puducherry|paradise/.test(n)) return 'Beaches';
  if (/mount|hills|valley|manali|shimla|spiti|dharamshala|kasol|dalhousie|khajjiar|kasauli|coorg|chikmagalur|munnar|wayanad|vagamon|ooty|kodaikanal|yercaud|gangtok|pelling|lachen|lachung|nathula|auli|nainital|mussoorie|darjeeling|kalimpong|mirik|mechuka|tawang|bomdila|dirang|sela|tirth|dawki|mawlynnong|aizawl|phawngpui|dzukou|kohima|reiek|chopta|pithoragarh|gulmarg|pahalgam|sonamarg|gurez|ladakh|leh|nubra|zanskar|lamayuru|thiksey|turtuk|hanle/.test(n)) return 'Hill Stations';
  if (/fort|cave|heritage|hampi|mysuru|badami|aihole|ajanta|ellora|mumbai|pune|hyderabad|warangal|jaipur|jodhpur|jaisalmer|udaipur|bikaner|chittorgarh|kumbhalgarh|bundi|alwar|deeg|delhi|agra|lucknow|prayagraj|jhansi|fatehpur|patiala|kapurthala|murshidabad|bishnupur|kolkata|shantiniketan|sanchi|gwalior|mandu|orchha|bhopal|indore|cuttack|bhubaneswar|dhauli|barabati|patna|vaishali|rajgir|amravati|vijayawada|gandikota|visakhapatnam|rajahmundry|chennai|mahabalipuram|thanjavur|chandigarh|rock garden|capitol|museum|qutub|red fort|humayun|lotus|purana qila|auroville|white town|arche|arak/.test(n)) return 'Culture';
  if (/trek|pass|adventure|dudh sagar|dudhsagar|dzukou|spiti|gulmarg|nathula|khardung|pangong|ts[oō] moriri|zanskar|rafting|rishikesh/.test(n)) return 'Adventure';
  if (/food|old delhi|lucknow|amritsar|hyderabad|mumbai|indore|surat|kath/.test(n)) return 'Food';
  return index % 3 === 0 ? 'Nature' : index % 3 === 1 ? 'Culture' : 'Nature';
};

const emojiFor = (category: string) => ({ Bhakti: '🛕', Wildlife: '🐅', Beaches: '🏖️', 'Hill Stations': '⛰️', Adventure: '🥾', Culture: '🏛️', Food: '🍲', Nature: '🌿' }[category] || '📍');
const toneFor = (category: string) => ({ Bhakti: 'temple', Wildlife: 'forest', Beaches: 'beach', 'Hill Stations': 'mountain', Adventure: 'desert', Culture: 'heritage', Food: 'city', Nature: 'green' }[category] || 'green');

export const states: StateData[] = Object.entries(placeNames).map(([name, places]) => ({
  name,
  places: places.map((place, index) => {
    const category = categoryFor(place, index);
    return { name: place, city: name, category, emoji: emojiFor(category), tone: toneFor(category), description: `${place} is a featured Indian travel destination for ${category.toLowerCase()} experiences, local culture and memorable journeys.` };
  }),
}));
