import api from "./api";

export const fetchIncidents = (status = "OPEN") =>
  api.get("/incidents", {
    params: { status },
  }).then(res => res.data);

export const resolveIncident = (id) =>
  api.post(`/incidents/${id}/resolve`);

export const createIncident = (payload) =>
  api.post("/incidents", payload);
