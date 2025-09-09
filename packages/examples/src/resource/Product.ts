import { Resource } from "@juadz/core";
import dataProvider from "../repository/product";

export const ProductResource = new Resource(dataProvider);

ProductResource.authentication = ["userJwt", "apiKey"];
