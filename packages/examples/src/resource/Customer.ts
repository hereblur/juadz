import { Resource } from "@juadz/core";
import dataProvider from "../repository/customer";

export const CustomerResource = new Resource(dataProvider);

CustomerResource.authentication = ["userJwt", "apiKey"];
