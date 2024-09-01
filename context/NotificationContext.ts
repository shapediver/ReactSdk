import { createContext } from "react";
import { notifications } from "@mantine/notifications";
import { NotificationContextType } from "../types/context/NotificationContext";

/** Information about a template. */
export const NotificationContext = createContext<NotificationContextType>(notifications);
