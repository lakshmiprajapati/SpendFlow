
import {
  createPurchaseRequest,
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
