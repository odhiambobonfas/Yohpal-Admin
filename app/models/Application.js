import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel';  

class Transaction extends AppModel {
    static table = ''; 

    static collection = 'ypApplications';

    static fields = {};

    static nullableFields = [];

    /**
     * Defines all model associations and relationships.
     * This method is automatically called after all models are initialized.
     * 
     * @param {Object.<string, Model>} models - Dictionary of all initialized models,
     *   keyed by model name. Use this to reference other models when defining associations.
     */
    static associate(models) {
        // Define all associations here
    }

    static async ypApplications(redis) { 
        const cacheKey = `yp:applications`
        const apps = redis.cacheParser(
            cacheKey,
            () => {
                return [
                    { name: 'Yohpal', slug: 'yohpal', default: true, description: "Meant for the main Yohpal application" },
                    { name: 'Yohpal Chat', slug: 'chat', description: "Handles messaging, group chats, and real-time communication" },
                    { name: 'Yohpal Manager', slug: 'manager', description: "For management and administrative operations" },
                    { name: 'Yohpal Market', slug: 'market', description: "Marketplace for buying, selling, and trading" },
                    { name: 'Yohpal Admin', slug: 'admin', description: "Administrative control panel for the Yohpal ecosystem" },
                    { name: 'Yohpal Hustle', slug: 'hustle', description: "Freelance and gig management platform" },
                    { name: 'Yohpal Other', slug: 'other', description: "For miscellaneous or experimental Yohpal modules" },
                ];
            },
            7200
        );

        return apps
    } 
        
    static async countriesList(redis) {
        const cacheKey = `yp:countries:list`;
        const countries = redis.cacheParser(
            cacheKey,
            () => {
                return [
                    { name: 'Afghanistan', slug: 'afghanistan' },
                    { name: 'Albania', slug: 'albania' },
                    { name: 'Algeria', slug: 'algeria' },
                    { name: 'Andorra', slug: 'andorra' },
                    { name: 'Angola', slug: 'angola' },
                    { name: 'Antigua and Barbuda', slug: 'antigua-and-barbuda' },
                    { name: 'Argentina', slug: 'argentina' },
                    { name: 'Armenia', slug: 'armenia' },
                    { name: 'Australia', slug: 'australia' },
                    { name: 'Austria', slug: 'austria' },
                    { name: 'Azerbaijan', slug: 'azerbaijan' },
                    { name: 'Bahamas', slug: 'bahamas' },
                    { name: 'Bahrain', slug: 'bahrain' },
                    { name: 'Bangladesh', slug: 'bangladesh' },
                    { name: 'Barbados', slug: 'barbados' },
                    { name: 'Belarus', slug: 'belarus' },
                    { name: 'Belgium', slug: 'belgium' },
                    { name: 'Belize', slug: 'belize' },
                    { name: 'Benin', slug: 'benin' },
                    { name: 'Bhutan', slug: 'bhutan' },
                    { name: 'Bolivia', slug: 'bolivia' },
                    { name: 'Bosnia and Herzegovina', slug: 'bosnia-and-herzegovina' },
                    { name: 'Botswana', slug: 'botswana' },
                    { name: 'Brazil', slug: 'brazil' },
                    { name: 'Brunei', slug: 'brunei' },
                    { name: 'Bulgaria', slug: 'bulgaria' },
                    { name: 'Burkina Faso', slug: 'burkina-faso' },
                    { name: 'Burundi', slug: 'burundi' },
                    { name: 'Cabo Verde', slug: 'cabo-verde' },
                    { name: 'Cambodia', slug: 'cambodia' },
                    { name: 'Cameroon', slug: 'cameroon' },
                    { name: 'Canada', slug: 'canada' },
                    { name: 'Central African Republic', slug: 'central-african-republic' },
                    { name: 'Chad', slug: 'chad' },
                    { name: 'Chile', slug: 'chile' },
                    { name: 'China', slug: 'china' },
                    { name: 'Colombia', slug: 'colombia' },
                    { name: 'Comoros', slug: 'comoros' },
                    { name: 'Congo (Congo-Brazzaville)', slug: 'congo' },
                    { name: 'Costa Rica', slug: 'costa-rica' },
                    { name: 'Croatia', slug: 'croatia' },
                    { name: 'Cuba', slug: 'cuba' },
                    { name: 'Cyprus', slug: 'cyprus' },
                    { name: 'Czechia', slug: 'czechia' },
                    { name: 'Democratic Republic of the Congo', slug: 'democratic-republic-of-the-congo' },
                    { name: 'Denmark', slug: 'denmark' },
                    { name: 'Djibouti', slug: 'djibouti' },
                    { name: 'Dominica', slug: 'dominica' },
                    { name: 'Dominican Republic', slug: 'dominican-republic' },
                    { name: 'Ecuador', slug: 'ecuador' },
                    { name: 'Egypt', slug: 'egypt' },
                    { name: 'El Salvador', slug: 'el-salvador' },
                    { name: 'Equatorial Guinea', slug: 'equatorial-guinea' },
                    { name: 'Eritrea', slug: 'eritrea' },
                    { name: 'Estonia', slug: 'estonia' },
                    { name: 'Eswatini', slug: 'eswatini' },
                    { name: 'Ethiopia', slug: 'ethiopia' },
                    { name: 'Fiji', slug: 'fiji' },
                    { name: 'Finland', slug: 'finland' },
                    { name: 'France', slug: 'france' },
                    { name: 'Gabon', slug: 'gabon' },
                    { name: 'Gambia', slug: 'gambia' },
                    { name: 'Georgia', slug: 'georgia' },
                    { name: 'Germany', slug: 'germany' },
                    { name: 'Ghana', slug: 'ghana' },
                    { name: 'Greece', slug: 'greece' },
                    { name: 'Grenada', slug: 'grenada' },
                    { name: 'Guatemala', slug: 'guatemala' },
                    { name: 'Guinea', slug: 'guinea' },
                    { name: 'Guinea-Bissau', slug: 'guinea-bissau' },
                    { name: 'Guyana', slug: 'guyana' },
                    { name: 'Haiti', slug: 'haiti' },
                    { name: 'Honduras', slug: 'honduras' },
                    { name: 'Hungary', slug: 'hungary' },
                    { name: 'Iceland', slug: 'iceland' },
                    { name: 'India', slug: 'india' },
                    { name: 'Indonesia', slug: 'indonesia' },
                    { name: 'Iran', slug: 'iran' },
                    { name: 'Iraq', slug: 'iraq' },
                    { name: 'Ireland', slug: 'ireland' },
                    { name: 'Israel', slug: 'israel' },
                    { name: 'Italy', slug: 'italy' },
                    { name: 'Jamaica', slug: 'jamaica' },
                    { name: 'Japan', slug: 'japan' },
                    { name: 'Jordan', slug: 'jordan' },
                    { name: 'Kazakhstan', slug: 'kazakhstan' },
                    { name: 'Kenya', slug: 'kenya', default: true },
                    { name: 'Kiribati', slug: 'kiribati' },
                    { name: 'Kuwait', slug: 'kuwait' },
                    { name: 'Kyrgyzstan', slug: 'kyrgyzstan' },
                    { name: 'Laos', slug: 'laos' },
                    { name: 'Latvia', slug: 'latvia' },
                    { name: 'Lebanon', slug: 'lebanon' },
                    { name: 'Lesotho', slug: 'lesotho' },
                    { name: 'Liberia', slug: 'liberia' },
                    { name: 'Libya', slug: 'libya' },
                    { name: 'Liechtenstein', slug: 'liechtenstein' },
                    { name: 'Lithuania', slug: 'lithuania' },
                    { name: 'Luxembourg', slug: 'luxembourg' },
                    { name: 'Madagascar', slug: 'madagascar' },
                    { name: 'Malawi', slug: 'malawi' },
                    { name: 'Malaysia', slug: 'malaysia' },
                    { name: 'Maldives', slug: 'maldives' },
                    { name: 'Mali', slug: 'mali' },
                    { name: 'Malta', slug: 'malta' },
                    { name: 'Marshall Islands', slug: 'marshall-islands' },
                    { name: 'Mauritania', slug: 'mauritania' },
                    { name: 'Mauritius', slug: 'mauritius' },
                    { name: 'Mexico', slug: 'mexico' },
                    { name: 'Micronesia', slug: 'micronesia' },
                    { name: 'Moldova', slug: 'moldova' },
                    { name: 'Monaco', slug: 'monaco' },
                    { name: 'Mongolia', slug: 'mongolia' },
                    { name: 'Montenegro', slug: 'montenegro' },
                    { name: 'Morocco', slug: 'morocco' },
                    { name: 'Mozambique', slug: 'mozambique' },
                    { name: 'Myanmar (Burma)', slug: 'myanmar' },
                    { name: 'Namibia', slug: 'namibia' },
                    { name: 'Nauru', slug: 'nauru' },
                    { name: 'Nepal', slug: 'nepal' },
                    { name: 'Netherlands', slug: 'netherlands' },
                    { name: 'New Zealand', slug: 'new-zealand' },
                    { name: 'Nicaragua', slug: 'nicaragua' },
                    { name: 'Niger', slug: 'niger' },
                    { name: 'Nigeria', slug: 'nigeria' },
                    { name: 'North Korea', slug: 'north-korea' },
                    { name: 'North Macedonia', slug: 'north-macedonia' },
                    { name: 'Norway', slug: 'norway' },
                    { name: 'Oman', slug: 'oman' },
                    { name: 'Pakistan', slug: 'pakistan' },
                    { name: 'Palau', slug: 'palau' },
                    { name: 'Palestine State', slug: 'palestine' },
                    { name: 'Panama', slug: 'panama' },
                    { name: 'Papua New Guinea', slug: 'papua-new-guinea' },
                    { name: 'Paraguay', slug: 'paraguay' },
                    { name: 'Peru', slug: 'peru' },
                    { name: 'Philippines', slug: 'philippines' },
                    { name: 'Poland', slug: 'poland' },
                    { name: 'Portugal', slug: 'portugal' },
                    { name: 'Qatar', slug: 'qatar' },
                    { name: 'Romania', slug: 'romania' },
                    { name: 'Russia', slug: 'russia' },
                    { name: 'Rwanda', slug: 'rwanda' },
                    { name: 'Saint Kitts and Nevis', slug: 'saint-kitts-and-nevis' },
                    { name: 'Saint Lucia', slug: 'saint-lucia' },
                    { name: 'Saint Vincent and the Grenadines', slug: 'saint-vincent-and-the-grenadines' },
                    { name: 'Samoa', slug: 'samoa' },
                    { name: 'San Marino', slug: 'san-marino' },
                    { name: 'Sao Tome and Principe', slug: 'sao-tome-and-principe' },
                    { name: 'Saudi Arabia', slug: 'saudi-arabia' },
                    { name: 'Senegal', slug: 'senegal' },
                    { name: 'Serbia', slug: 'serbia' },
                    { name: 'Seychelles', slug: 'seychelles' },
                    { name: 'Sierra Leone', slug: 'sierra-leone' },
                    { name: 'Singapore', slug: 'singapore' },
                    { name: 'Slovakia', slug: 'slovakia' },
                    { name: 'Slovenia', slug: 'slovenia' },
                    { name: 'Solomon Islands', slug: 'solomon-islands' },
                    { name: 'Somalia', slug: 'somalia' },
                    { name: 'South Africa', slug: 'south-africa' },
                    { name: 'South Korea', slug: 'south-korea' },
                    { name: 'South Sudan', slug: 'south-sudan' },
                    { name: 'Spain', slug: 'spain' },
                    { name: 'Sri Lanka', slug: 'sri-lanka' },
                    { name: 'Sudan', slug: 'sudan' },
                    { name: 'Suriname', slug: 'suriname' },
                    { name: 'Sweden', slug: 'sweden' },
                    { name: 'Switzerland', slug: 'switzerland' },
                    { name: 'Syria', slug: 'syria' },
                    { name: 'Taiwan', slug: 'taiwan' },
                    { name: 'Tajikistan', slug: 'tajikistan' },
                    { name: 'Tanzania', slug: 'tanzania' },
                    { name: 'Thailand', slug: 'thailand' },
                    { name: 'Timor-Leste', slug: 'timor-leste' },
                    { name: 'Togo', slug: 'togo' },
                    { name: 'Tonga', slug: 'tonga' },
                    { name: 'Trinidad and Tobago', slug: 'trinidad-and-tobago' },
                    { name: 'Tunisia', slug: 'tunisia' },
                    { name: 'Turkey', slug: 'turkey' },
                    { name: 'Turkmenistan', slug: 'turkmenistan' },
                    { name: 'Tuvalu', slug: 'tuvalu' },
                    { name: 'Uganda', slug: 'uganda' },
                    { name: 'Ukraine', slug: 'ukraine' },
                    { name: 'United Arab Emirates', slug: 'united-arab-emirates' },
                    { name: 'United Kingdom', slug: 'united-kingdom' },
                    { name: 'United States of America', slug: 'united-states' },
                    { name: 'Uruguay', slug: 'uruguay' },
                    { name: 'Uzbekistan', slug: 'uzbekistan' },
                    { name: 'Vanuatu', slug: 'vanuatu' },
                    { name: 'Vatican City', slug: 'vatican-city' },
                    { name: 'Venezuela', slug: 'venezuela' },
                    { name: 'Vietnam', slug: 'vietnam' },
                    { name: 'Yemen', slug: 'yemen' },
                    { name: 'Zambia', slug: 'zambia' },
                    { name: 'Zimbabwe', slug: 'zimbabwe' },
                ];
            }
        );

        return countries;
    }
    
    static async countriesForDropdown(redis, linkedCountry) {
        let html = '';
        const countries = await this.countriesList(redis);

        countries.forEach(method => {
            const isSelected = (linkedCountry == method.slug) ? 'selected' : '';       
            html += `<option value="${method.slug}" ${isSelected}>${method.name}</option>`;
        });

        return html;
    }
}

export default Transaction;
