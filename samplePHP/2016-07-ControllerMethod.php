public function authenticateUpdate($id)
    {
        $product = Product::find($id);
        $status = Input::get('auth_status');
        switch ($status) {
            case ProductAuthenticationStatus::AUTHENTIC:
                $this->productRepository->markAsAuthentic($product, Auth::admin()->get()->id);
                $message = 'Item successfully authenticated';
                $pendingItem = $product->pendingItem;
                if ($product->isBuyOut()) {
                    $this->accountBalanceCreditRepository->payUserForAuthenticAndReviewedProduct($product->supplier, $product, $pendingItem);
                }
                break;
            case ProductAuthenticationStatus::FAKE:
                $product->authentication_status = $status;
                $product->removed_from_inventory_at = Carbon::now();
                $product->save();
                $message = 'Item marked as fake';
                $context = [
                    'name' => $product->supplier->first_name,
                    'email' => $product->supplier->email,
                    'brand' => $product->brand()->name

                ];
                $this->userMailer->sendNotAuthenticEmail($context);
                $attributes = [
                    'comment' => 'Email regarding not authentic sent to supplier'
                ];
                $this->commentRepository->createFromAdmin($attributes, $product, Auth::admin()->get());
                break;
            default:
                $data = [
                    'location_1' => 'My Desk',
                    'location_2' => '',
                    'location_3' => ''
                ];
                $this->productLocationsLogRepository->updateForProduct($product, Auth::admin()->get(), $data);
                $message = 'Location updated to your desk for further review';
                $product->authentication_status = $status;
                $product->authenticator_id = Auth::admin()->get()->id;
                $product->authenticated_at = Carbon::now();
                $product->save();
                break;
        }

        return Response::json([
            'success' => true,
            'message' => $message
        ]);
    }