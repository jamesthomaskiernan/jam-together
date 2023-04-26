import React, { useState, useEffect, useRef } from "react";
import TextField from "@mui/material/TextField";

let autoComplete;

const loadScript = (url, callback) => {
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "googleMaps"

    if (script.readyState) {
        script.onreadystatechange = function() {
            if (script.readyState === "loaded" || script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {
        script.onload = () => callback();
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
};

function handleScriptLoad(updateQuery, autoCompleteRef) {
    autoComplete = new window.google.maps.places.Autocomplete(
        autoCompleteRef.current, {
            componentRestrictions: { country: "us" }
        }
    );
    autoComplete.setFields(["address_components"]);
    autoComplete.addListener("place_changed", () =>
        handlePlaceSelect(updateQuery)
    );
}

async function handlePlaceSelect(updateQuery) {
    const addressObject = autoComplete.getPlace();
    const query = addressObject.address_components;
    console.log(query);
    updateQuery(query);
}

function SearchLocationInput({address, setAddress, autofillAddress}) {
    const autoCompleteRef = useRef(null);

    useEffect(() => {
        loadScript(
            `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`,
            () => handleScriptLoad(autofillAddress, autoCompleteRef)
        );
    }, []);

    return (
            <input className="search-location-input"
                ref={autoCompleteRef}
                onChange={(event) => {
                    setAddress(event.target.value);
                }}
                value={address}
                placeholder="Address"
                   id='address'
            />
    );
}

export default SearchLocationInput;
