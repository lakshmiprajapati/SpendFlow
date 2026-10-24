import {
  createPurchaseRequest,
  getMyPurchaseRequests,
  getPurchaseRequestById,
  updateDraftPurchaseRequest,
  submitPurchaseRequest,
  getPendingApprovals,
  decidePurchaseRequest,
  resubmitPurchaseRequest,
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


export const submitRequest = async (req, res, next) => {
  try {
    const request = await submitPurchaseRequest(
      req.user._id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Purchase request submitted for approval",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerPendingApprovals = async (req, res, next) => {
  try {
    const requests = await getPendingApprovals(req.user._id);

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


export const decideRequest = async (req, res, next) => {
  try {
    const { decision, comment = "" } = req.body;

    const request = await decidePurchaseRequest(
      req.user._id,
      req.params.id,
      decision,
      comment
    );

    return res.status(200).json({
      success: true,
      message:
        decision === "approve"
          ? "Purchase request approved successfully"
          : "Purchase request rejected successfully",
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};


export const resubmitRequest = async (req, res, next) => {
  try {
    const request = await resubmitPurchaseRequest(
      req.user._id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Purchase request resubmitted successfully",
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};