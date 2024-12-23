import { Dimensions } from "react-native";
import { supabase } from "../lib/supabase";


const {width: deviceWidth, height: deviceHeight} = Dimensions.get('window');


export const hp  = percentage => {
    return (percentage*deviceHeight) / 100;
}

export const wp  = percentage => {
    return (percentage*deviceWidth) / 100;
}

export const stripHtmlTags = (html) => {
    return html.replace(/<[^>]*>?/gm, '')
}

// function generate the unique game pin id 
// make sure that the pin id is the unique
export const generateUniquePin = async () => {
    let unique = false;
    let pin;

    while (!unique) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

}