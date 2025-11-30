import { Metadata } from "next";
import MaterialsClient from "./MaterialsClient";

export const metadata: Metadata = {
    title: "さがす",
};

export default function MaterialsPage() {
    return <MaterialsClient />;
}
