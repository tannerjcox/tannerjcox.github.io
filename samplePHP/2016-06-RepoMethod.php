//2016-06-RepoMethod
public function receiveProduct($pendingItem, $previousProduct, $input, $admin)
    {
        $now = Carbon::now();
        $sku = $this->skuDecider->decide($input);
        if ($previousProduct) {
            $previousOrderDetails = $previousProduct->orderDetail;
            $previousOrderDetails->is_buyback_requested = true;
            $previousOrderDetails->save();

            $except = ['id', 'previous_product_id', 'created_at', 'updated_at', 'sold_at', 'made_available_at', 'approved_at', 'approver_id', 'reviewed_at', 'reviewer_id'];
            $product = $previousProduct->replicate($except);
            $product->sku = SkuType::BUY_BACK;
            $product->buyback_product_id = $previousProduct->id;
            $product->purchase_price = $pendingItem ? $pendingItem->buyback_quote : $previousOrderDetails->total * .7;
            $product->save();

            if (array_get($input, 'copy_images')) {
                $this->imageMigrator->migrate($previousProduct, $product);
            }
        } else {
            if (!$pendingItem) {
                $title = array_get($input, 'basic_description') ?: 'Unquoted Consignment';
            } else {
                $title = array_get($input, 'title') ?: $pendingItem->product_name;
            }
            $product = new Product();
            $product->title = $title;
        }
        $product->sku = $sku;
        $product->hold_status = 'approval_awaiting';
        $product->quantity = 1;
        $product->is_enabled = false;
        $product->checker_id = $admin->id;
        $product->warehouse_id = $admin->warehouse_id;
        $product->check_in_warehouse_id = $admin->warehouse_id;
        $product->pending_item_id = $pendingItem ? $pendingItem->id : null;
        $product->reference_product_id = array_get($input, 'reference_product_id') ?: ($pendingItem ? $pendingItem->reference_product_id : null);
        $product->supplier_id = array_get($input, 'userId');
        $product->date_code = array_get($input, 'date_code') ?: null;
        $product->ships_with = array_get($input, 'ships_with') ?: null;
        $product->flagged_interesting_at = array_get($input, 'flag_as_interesting') ? Carbon::now() : null;
        $product->length = array_get($input, 'length', $product->length);
        $product->width = array_get($input, 'width', $product->width);
        $product->height = array_get($input, 'height', $product->height);
        $product->drop = array_get($input, 'drop', $product->drop);
        $product->year = array_get($input, 'year', $product->year);
        $product->season = array_get($input, 'season', $product->season);
        if ($pendingItem && $pendingItem->is_showroom_quote) {
            if (!SkuType::isConsignment($sku) && array_get($input, 'supplier_is_paid')  == 'Yes') {
                $product->buyout_paid_at = $now;
                $product->purchase_price = $pendingItem->buyout_quote;
            }
            $product->retail_price = $pendingItem->retail_price;
            $product->price = $pendingItem->product_price;
            $product->pricer_id = $pendingItem->admin_id;
            $product->priced_at = $pendingItem->created_at;
            $pendingItemPresenter = $pendingItem->getPresenter();
            $product->condition = $pendingItemPresenter->product_general_condition;
            $product->reviewer_id = Admin::FASHIONPHILE_BOT;
            $product->reviewed_at = Carbon::now();
            if (array_get($input, 'is_authentic')) {
                $this->markAsAuthentic($product, $pendingItem->admin_id);
                if (!SkuType::isConsignment($sku)) {
                    $this->accountBalanceCredit->payUserForAuthenticAndReviewedProduct($product->supplier, $product, $pendingItem);
                }
            }
        }
        $product->save();
        if (array_key_exists('brand_id', $input)) {
            $product = $this->updateListing($product, $input, $admin);
        } elseif ($previousProduct) {
            $categories = $previousProduct->categories()->get();
            foreach ($categories as $category) {
                $product->categories()->save($category);
            }
            if ($previousProduct->brand()) {
                $product->brands()->save($previousProduct->brand());
            }
        }
        $this->updateCondition($product, $input);
        return $product;
    }