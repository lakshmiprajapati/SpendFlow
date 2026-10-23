import {
  createPurchaseRequest,
  getMyPurchaseRequests,
  getPurchaseRequestById,
  updateDraftPurchaseRequest,
} from "../services/purchaseRequestService.js";



export const createRequest = async (req, res, next) => {
  try {
    const purchaseRequest = await createPurchaseRequest(
      req.user._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Purchase request created successfully",
      data: {
        request: purchaseRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};



export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await getMyPurchaseRequests(req.user._id);

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: {
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getRequestById = async (req, res, next) => {
  try {
    const request = await getPurchaseRequestById(
      req.user._id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: {
        request,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const updateDraftRequest = async (req, res, next) => {
  try {
    const request = await updateDraftPurchaseRequest(
      req.user._id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Purchase request updated successfully",
      data: {
        request,
      },
    });
  } catch (error) {
    next(error);
  }
};
