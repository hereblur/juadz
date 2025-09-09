import { Resource } from "@juadz/core";
import dataRepo from "../repository/category";


export const CategoryResource = new Resource(dataRepo);

CategoryResource.permissionName = "products";
CategoryResource.authentication = ["userJwt", "apiKey"];

// Disable some routes
CategoryResource.disabled(['create', 'update'])