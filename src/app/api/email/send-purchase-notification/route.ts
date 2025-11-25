import { NextRequest, NextResponse } from 'next/server';
import { 
  sendPurchaseSubmissionEmail, 
  sendPurchaseStatusEmail,
  sendPurchaseProductUploadedEmail,
  sendPurchaseProductVerifiedEmail,
  sendPurchaseProductRejectedEmail,
  sendPurchaseAssetCreatedEmail,
  sendPurchaseDuplicateSerialEmail
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, requestData, adminEmail, staffEmail, verificationNotes, rejectionReason, assetRequest, duplicateSerialNo } = body;

    if (!type || !requestData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'submission':
        result = await sendPurchaseSubmissionEmail(requestData);
        break;
      case 'status_update':
        result = await sendPurchaseStatusEmail(requestData);
        break;
      case 'new_request':
        if (!adminEmail) {
          return NextResponse.json(
            { error: 'Admin email is required for new request notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseSubmissionEmail({
          adminEmail,
          staffName: requestData.staff?.name || requestData.name || 'Staff Member',
          staffEmail: requestData.staff?.email || 'staff@example.com',
          purchaseItem: requestData.purchase_item || 'Unknown Item',
          branch: requestData.branch || 'Unknown Branch',
          requestDate: requestData.created_at || new Date().toISOString()
        });
        break;
      case 'approved':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for approval notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseStatusEmail({
          staffEmail,
          staffName: requestData.staff?.name || requestData.name || 'Staff Member',
          purchaseItem: requestData.purchase_item || 'Unknown Item',
          status: 'approved',
          adminNotes: requestData.admin_notes
        });
        break;
      case 'rejected':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for rejection notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseStatusEmail({
          staffEmail,
          staffName: requestData.staff?.name || requestData.name || 'Staff Member',
          purchaseItem: requestData.purchase_item || 'Unknown Item',
          status: 'rejected',
          rejectionReason: requestData.rejection_reason
        });
        break;
      case 'product_uploaded':
        if (!adminEmail) {
          return NextResponse.json(
            { error: 'Admin email is required for product upload notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseProductUploadedEmail(requestData, adminEmail);
        break;
      case 'product_verified':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for product verification notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseProductVerifiedEmail(requestData, staffEmail, verificationNotes);
        break;
      case 'product_rejected':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for product rejection notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseProductRejectedEmail(requestData, staffEmail, rejectionReason);
        break;
      case 'asset_created':
        if (!staffEmail || !assetRequest) {
          return NextResponse.json(
            { error: 'Staff email and asset request are required for asset creation notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseAssetCreatedEmail(requestData, assetRequest, staffEmail);
        break;
      case 'duplicate_serial':
        if (!staffEmail || !duplicateSerialNo) {
          return NextResponse.json(
            { error: 'Staff email and duplicate serial number are required for duplicate notification' },
            { status: 400 }
          );
        }
        result = await sendPurchaseDuplicateSerialEmail(requestData, duplicateSerialNo, staffEmail);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending purchase notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}


