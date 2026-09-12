(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.DecisionLab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const AXES={
    customer:'العميل والمشكلة',
    demand:'دليل الطلب',
    economics:'الأرقام والسيولة',
    execution:'التنفيذ والتشغيل',
    decision:'وضوح القرار والقياس'
  };
  const STAGES={idea:'فكرة / تحت التأسيس',running:'مشروع قائم'};
  const SCALE=[
    {value:0,label:'لا أعرف / مجرد توقع'},
    {value:1,label:'عندي ملاحظات محدودة'},
    {value:2,label:'عندي بيانات أو تجربة أولية'},
    {value:3,label:'عندي سجل متكرر أو دليل مباشر'}
  ];
  const QUICK_MAP={
    'عندي فكرة مشروع':'idea_validation',
    'التسعير':'pricing',
    'المبيعات':'sales',
    'السيولة والتحصيل':'cashflow',
    'التشغيل':'operations',
    'التكاليف':'cost_reduction',
    'التوسع':'expansion',
    'فتح فرع':'new_branch',
    'منتج أو خدمة جديدة':'new_product',
    'قرار آخر':'general_decision'
  };
  const DECISIONS={
    idea_validation:{label:'اختبار جدوى الفكرة مبدئيًا',keywords:['فكرة','ابدأ','ابدا','تستحق التنفيذ','مشروع جديد','تحت التاسيس'],confirm:'هل الفكرة تستحق اختبارًا صغيرًا قبل أن تزيد وقتك أو التزامك المالي؟',noGo:'لا تبدأ بتجهيز كامل أو شراء أدوات قبل أن ترى التزامًا فعليًا من عميل مناسب.',cta:'شوف مسار اختبار الفكرة داخل البرنامج',riskBias:3},
    pricing:{label:'قرار التسعير',keywords:['تسعير','سعر','اسعر','أُسعّر','ارفع السعر','أرفع السعر','سعري','غالي','رخيص','خصم'],confirm:'هل السعر الحالي يعكس القيمة والتكلفة، وهل رفعه أو تغييره قرار يمكن اختباره بأمان؟',noGo:'لا تخفض أو ترفع السعر على الجميع قبل معرفة هامش المساهمة واختبار شريحة محدودة.',cta:'شوف مسار التسعير وهامش المساهمة داخل البرنامج',riskBias:2},
    cashflow:{label:'السيولة والتحصيل',keywords:['كاش','سيولة','تحصيل','قبض','مفيش فلوس','آخر الشهر','اخر الشهر','متاخر في الدفع','متأخر في الدفع'],confirm:'هل فجوة السيولة سببها توقيت التحصيل أم الهامش أم طريقة التشغيل؟',noGo:'لا تزود المبيعات أو الإعلان قبل فصل البيع عن التحصيل ومعرفة دورة دخول النقد.',cta:'شوف إزاي البرنامج بيربط المبيعات بالتحصيل والسيولة',riskBias:5},
    sales:{label:'قرار المبيعات',keywords:['مبيعات','بيع','مش ببيع','العملاء مش بتشتري','اقفال','إقفال','صفقات'],confirm:'هل ضعف المبيعات سببه العرض أم الشريحة أم خطوات البيع والمتابعة؟',noGo:'لا تضاعف النشاط البيعي قبل معرفة أين يتوقف العميل في مسار الشراء.',cta:'شوف مسار تشخيص المبيعات داخل البرنامج',riskBias:2},
    marketing:{label:'قرار التسويق والإعلان',keywords:['اعلان','إعلان','تسويق','حملة','ليدز','عملاء محتملين','تكلفة العميل'],confirm:'هل المشكلة في الوصول إلى العميل أم جودة الرسالة أم التحويل بعد الإعلان؟',noGo:'لا تزود ميزانية الإعلان قبل قياس جودة العميل وهامش المساهمة والتحويل الفعلي.',cta:'شوف مسار ربط التسويق بالطلب الحقيقي داخل البرنامج',riskBias:4},
    cost_reduction:{label:'قرار خفض التكاليف',keywords:['تكاليف','تكلفة','مصروفات','خفض','اوفر','أوفر','غالي عليا'],confirm:'أي تكلفة يمكن خفضها من غير أن تضر التسليم أو الطلب أو التحصيل؟',noGo:'لا تخفض تكلفة لأنها كبيرة فقط؛ افصل ما يحمي الإيراد عما لا يضيف قيمة.',cta:'شوف مسار تحليل التكلفة وهامش المساهمة داخل البرنامج',riskBias:3},
    operations:{label:'قرار التشغيل',keywords:['تشغيل','تاخير','تأخير','تسليم','جودة','اخطاء','أخطاء','مخزون','عملية','انتاج','إنتاج'],confirm:'أين يوجد الاختناق الحقيقي الذي يبطئ التسليم أو يرفع إعادة العمل؟',noGo:'لا تضف موظفين أو أدوات قبل قياس نقطة الانتظار وإعادة العمل في المسار الحالي.',cta:'شوف مسار تشخيص التشغيل والاختناقات داخل البرنامج',riskBias:3},
    expansion:{label:'قرار التوسع',keywords:['توسع','اتوسع','أوسع','تكبير','سوق جديد','منطقة جديدة','نمو سريع'],confirm:'هل الطلب والاقتصاديات والطاقة التشغيلية تسمح بتجربة توسع محدودة؟',noGo:'لا تزود التزامًا ثابتًا قبل اختبار الطلب والطاقة التشغيلية في نطاق صغير.',cta:'شوف إزاي بنشخص قرار التوسع قبل الالتزام',riskBias:10},
    new_branch:{label:'قرار فتح فرع جديد',keywords:['فرع جديد','فتح فرع','افتح فرع','أفتح فرع','فرع تاني','فرع ثاني'],confirm:'هل فتح فرع جديد مدعوم بطلب متكرر واقتصاديات وطاقة تشغيلية قابلة للتكرار؟',noGo:'لا توقّع عقدًا أو تبدأ تجهيز فرع قبل اختبار الطلب والتشغيل بتجربة مؤقتة أقل تكلفة.',cta:'شوف إزاي بنختبر قرار الفرع الجديد قبل الالتزام',riskBias:14},
    new_product:{label:'منتج أو خدمة جديدة',keywords:['منتج جديد','خدمة جديدة','اطلق منتج','أطلق منتج','اضيف خدمة','أضيف خدمة'],confirm:'هل المنتج أو الخدمة الجديدة تحل مشكلة يدفع العميل المناسب لحلها؟',noGo:'لا تبنِ النسخة الكاملة قبل اختبار عرض صغير واستعداد واضح للدفع.',cta:'شوف مسار اختبار المنتج أو الخدمة الجديدة داخل البرنامج',riskBias:6},
    customer_concentration:{label:'تركيز العملاء',keywords:['عميل واحد','عميل كبير','معظم المبيعات','اعتماد على عميل','تركيز العملاء','خسارة عميل'],confirm:'هل اعتماد الإيراد على عدد محدود من العملاء يهدد القرار القادم؟',noGo:'لا تعالج التركّز بخصومات عامة؛ اختبر قناة أو شريحة بديلة بمؤشر واضح.',cta:'شوف مسار تشخيص تركّز العملاء داخل البرنامج',riskBias:8},
    general_decision:{label:'قرار مشروع عام',keywords:[],confirm:'ما القرار المحدد الذي يحتاج دليلًا إضافيًا قبل أن تتحرك؟',noGo:'لا تزود التزامك قبل تحديد القرار نفسه والدليل الذي يمكن أن يغيّره.',cta:'شوف تفاصيل منهج التشخيص قبل الحل',riskBias:4}
  };

  const CORE={
    idea:[
      {id:'idea_customer',axis:'customer',prompt:'هل حددت عميلًا بعينه ومشكلة واضحة يحاول حلها الآن؟'},
      {id:'idea_demand',axis:'demand',prompt:'هل اتخذ عميل مناسب خطوة فعلية تتجاوز الإعجاب بالفكرة؟'},
      {id:'idea_economics',axis:'economics',prompt:'هل لديك نطاق أولي للسعر والتكلفة وما الذي قد يغيّرهما؟'},
      {id:'idea_execution',axis:'execution',prompt:'هل تعرف أصغر نسخة تستطيع تسليمها خلال 7 أيام؟'},
      {id:'idea_decision',axis:'decision',prompt:'هل القرار القادم وحدود التوقف وموعد المراجعة مكتوبة بوضوح؟'},
      {id:'idea_evidence',metric:'evidence',evidenceWeight:2,prompt:'الدليل الأقوى الذي تعتمد عليه الآن مبني على إيه؟'}
    ],
    running:[
      {id:'run_customer',axis:'customer',prompt:'هل تعرف أي شريحة عميل تحقق تكرارًا وهامشًا وتحصل على قيمة واضحة؟'},
      {id:'run_demand',axis:'demand',prompt:'هل تستطيع فصل الطلب المتكرر عن الخصومات والصفقات المؤقتة؟'},
      {id:'run_economics',axis:'economics',prompt:'هل أرقام السعر والتكلفة والهامش والتحصيل موحدة لنفس الفترة؟'},
      {id:'run_execution',axis:'execution',prompt:'هل قست مسار الطلب من دخوله حتى التسليم والتحصيل؟'},
      {id:'run_decision',axis:'decision',prompt:'هل للقرار الحالي رقم حاكم وحد إيقاف وموعد مراجعة؟'},
      {id:'run_evidence',metric:'evidence',evidenceWeight:2,prompt:'الدليل الأقوى الذي تعتمد عليه الآن مبني على إيه؟'}
    ]
  };

  const TYPE_QUESTIONS={
    idea_validation:[
      {id:'iv_problem',axis:'customer',evidenceWeight:1,prompt:'كم شخصًا مناسبًا وصف المشكلة نفسها بدون أن تشرح له فكرتك؟'},
      {id:'iv_commitment',axis:'demand',evidenceWeight:1.5,prompt:'ما أقوى التزام حصلت عليه: وقت، تجربة، طلب، أم دفع؟'}
    ],
    pricing:[
      {id:'price_margin',axis:'economics',evidenceWeight:1.2,prompt:'هل تعرف هامش المساهمة بعد الخصم والمرتجع والتكلفة المتغيرة؟'},
      {id:'price_test',axis:'demand',evidenceWeight:1.3,prompt:'هل اختبرت سعرًا مختلفًا على شريحة محدودة وقست السلوك الفعلي؟'}
    ],
    cashflow:[
      {id:'cash_cycle',axis:'economics',evidenceWeight:1.4,prompt:'هل تعرف متوسط الأيام بين البيع ودخول النقد فعليًا؟'},
      {id:'cash_split',axis:'execution',evidenceWeight:1.1,prompt:'هل تفصل في سجلك بين البيع والفاتورة والتحصيل والمصروف؟'}
    ],
    sales:[
      {id:'sales_funnel',axis:'execution',evidenceWeight:1.2,prompt:'هل تعرف أين يتوقف العملاء بين الاهتمام والعرض والشراء؟'},
      {id:'sales_offer',axis:'customer',evidenceWeight:1,prompt:'هل العرض يربط مشكلة العميل بنتيجة محددة يمكنه تقييمها؟'}
    ],
    marketing:[
      {id:'marketing_quality',axis:'demand',evidenceWeight:1.2,prompt:'هل تقيس جودة العملاء المحتملين حتى الشراء، وليس عدد الرسائل فقط؟'},
      {id:'marketing_unit',axis:'economics',evidenceWeight:1.3,prompt:'هل تعرف تكلفة العميل مقابل هامش مساهمته المتوقع؟'}
    ],
    cost_reduction:[
      {id:'cost_value',axis:'economics',evidenceWeight:1.2,prompt:'هل صنفت التكلفة حسب أثرها على البيع والتسليم والتحصيل؟'},
      {id:'cost_test',axis:'execution',evidenceWeight:1,prompt:'هل تستطيع اختبار خفض تكلفة واحدة دون التأثير على الجودة؟'}
    ],
    operations:[
      {id:'ops_wait',axis:'execution',evidenceWeight:1.4,prompt:'هل لديك قياس لوقت الانتظار وإعادة العمل والاستثناءات؟'},
      {id:'ops_customer',axis:'customer',evidenceWeight:1,prompt:'هل تعرف أي تأخير يضر العميل فعلًا وأيهما مجرد إزعاج داخلي؟'}
    ],
    expansion:[
      {id:'expand_repeat',axis:'execution',evidenceWeight:1.2,prompt:'هل يمكن تكرار التشغيل الحالي دون اعتماد كامل عليك؟'},
      {id:'expand_demand',axis:'demand',evidenceWeight:1.4,prompt:'هل يوجد طلب مثبت في السوق أو المنطقة الجديدة؟'}
    ],
    new_branch:[
      {id:'branch_demand',axis:'demand',evidenceWeight:1.5,prompt:'هل لديك طلب قابل للقياس من المنطقة المستهدفة قبل فتح الفرع؟'},
      {id:'branch_economics',axis:'economics',evidenceWeight:1.3,prompt:'هل حسبت نقطة التعادل والتكلفة الثابتة وأسوأ سيناريو للفرع؟'}
    ],
    new_product:[
      {id:'product_problem',axis:'customer',evidenceWeight:1.2,prompt:'هل المشكلة التي يحلها المنتج الجديد أولوية واضحة للعميل؟'},
      {id:'product_preorder',axis:'demand',evidenceWeight:1.5,prompt:'هل حصلت على طلب تجريبي أو حجز أو دفع قبل البناء الكامل؟'}
    ],
    customer_concentration:[
      {id:'concentration_share',axis:'economics',evidenceWeight:1.3,prompt:'هل تعرف نسبة الإيراد والهامش والتحصيل المرتبطة بأكبر 3 عملاء؟'},
      {id:'concentration_alt',axis:'demand',evidenceWeight:1.1,prompt:'هل اختبرت شريحة أو قناة بديلة تقلل الاعتماد؟'}
    ],
    general_decision:[
      {id:'general_options',axis:'decision',evidenceWeight:1,prompt:'هل كتبت الخيارات الحقيقية بدل خيار واحد تحاول تبريره؟'},
      {id:'general_change',axis:'decision',evidenceWeight:1.2,prompt:'هل تعرف أي دليل جديد سيغيّر القرار فعلًا؟'}
    ]
  };

  const STAGE_FOLLOW={
    idea:{id:'stage_idea_commitment',axis:'demand',evidenceWeight:1,prompt:'هل طلبت من عميل مناسب التزامًا واضحًا بدل سؤال «عجبتك الفكرة؟»'},
    running:{id:'stage_run_90days',axis:'economics',evidenceWeight:1,prompt:'هل تستطيع استخراج سجل آخر 90 يومًا لنفس القرار دون تجميع يدوي متناقض؟'}
  };
  const WEAK_FOLLOW={
    customer:{id:'weak_customer',axis:'customer',evidenceWeight:1,prompt:'ما نسبة كلامك عن المشكلة المبني على ملاحظة العميل نفسه؟'},
    demand:{id:'weak_demand',axis:'demand',evidenceWeight:1.2,prompt:'هل لديك سلوك شراء أو التزام يمكن عده وتكراره؟'},
    economics:{id:'weak_economics',axis:'economics',evidenceWeight:1.2,prompt:'هل مصدر كل رقم وفترته وتعريفه مكتوب ويمكن مراجعته؟'},
    execution:{id:'weak_execution',axis:'execution',evidenceWeight:1,prompt:'هل توجد خطوة واحدة في التنفيذ قست وقتها وجودتها وتكلفتها؟'},
    decision:{id:'weak_decision',axis:'decision',evidenceWeight:1,prompt:'هل حددت متى تتحرك ومتى تتوقف ومتى تعيد التقييم؟'}
  };
  const GAP_INFO={
    customer:{why:'لو المشكلة أو الشريحة غير محددة، قد تختبر حلًا جيدًا مع عميل غير مناسب.',missing:'دليل مباشر من عميل مناسب على أهمية المشكلة وسلوكه الحالي.'},
    demand:{why:'الاهتمام لا يساوي طلبًا؛ القرار يحتاج سلوكًا أو التزامًا يمكن قياسه.',missing:'طلب أو تجربة أو شراء أو التزام فعلي يتجاوز الإعجاب.'},
    economics:{why:'اختلاط الفترات والتعريفات يخفي أثر السعر والتكلفة والتحصيل.',missing:'أرقام موحدة للفترة تشمل صافي السعر والتكلفة والنقد.'},
    execution:{why:'قرار جيد قد يفشل إذا كان المسار غير قابل للتسليم أو التكرار.',missing:'قياس لمسار التنفيذ والانتظار وإعادة العمل والاستثناءات.'},
    decision:{why:'بدون حد إيقاف وموعد مراجعة يتحول الاختبار إلى التزام مفتوح.',missing:'قرار محدد مع رقم حاكم وحد إيقاف وموعد مراجعة.'}
  };

  const PLANS={
    idea_validation:['اكتب المشكلة والعميل في جملة واحدة.','تحدث مع 3 عملاء مناسبين عن سلوكهم الحالي.','حوّل المشكلة إلى عرض اختبار صغير.','اعرض الاختبار على 5 عملاء وسجل الالتزام.','راجع الاعتراضات وعدّل فرضية واحدة.','حدد دليل النجاح وحد الإيقاف.','قرر: اختبار ثانٍ أم توقف مؤقت.'],
    pricing:['استخرج صافي السعر الحالي بعد الخصم.','احسب التكلفة المتغيرة وهامش المساهمة.','قسّم العملاء حسب القيمة والسلوك.','صمّم اختبار سعر محدود لشريحة واحدة.','نفّذ العرض وسجل القبول والرفض.','قارن الهامش والتحويل لا عدد الطلبات فقط.','راجع السعر وحدد خطوة التوسع.'],
    cashflow:['اجمع آخر 20 عملية بيع.','افصل تاريخ البيع عن تاريخ التحصيل.','احسب متوسط مدة التحصيل.','حدّد العملاء أو المنتجات الأبطأ نقدًا.','اختبر تعديل شرط تحصيل واحد.','قس أثره على النقد والطلب.','راجع قرارك بناءً على دورة النقد.'],
    sales:['ارسم خطوات العميل من الاهتمام للشراء.','احسب عدد العملاء في كل خطوة.','حدد أكبر نقطة تسرب.','راجع 5 محادثات أو عروض حقيقية.','اختبر تعديلًا واحدًا في العرض أو المتابعة.','قس الانتقال للخطوة التالية.','قرر الاحتفاظ بالتعديل أو إيقافه.'],
    marketing:['اربط مصدر العميل بالشراء الفعلي.','احسب تكلفة العميل لكل قناة.','افصل الرسائل عن العملاء المناسبين.','اختر رسالة واحدة لاختبار محدود.','نفّذ بميزانية ثابتة صغيرة.','قس الشراء والهامش لا النقر فقط.','قرر أين تضع الميزانية التالية.'],
    cost_reduction:['استخرج أكبر 10 بنود تكلفة.','اربط كل بند بالبيع أو التسليم.','حدد بندًا قليل الأثر على القيمة.','صمم خفضًا مؤقتًا قابلًا للرجوع.','طبق الخفض على نطاق صغير.','قس الجودة والوقت والهامش.','قرر التثبيت أو الرجوع.'],
    operations:['ارسم مسار طلب واحد من البداية للنقد.','قس وقت كل خطوة وانتظارها.','حدد أكبر اختناق أو إعادة عمل.','غيّر خطوة واحدة فقط.','اختبر التغيير على عدد محدود من الطلبات.','قس الوقت والجودة والتكلفة.','ثبت التحسين أو أعد التصميم.'],
    expansion:['حدد فرضية الطلب في النطاق الجديد.','قس طاقة التشغيل الحالية بدونك.','احسب التزام التوسع الثابت والمتغير.','صمم تجربة سوق صغيرة ومؤقتة.','نفذها بحد تكلفة واضح.','قس الطلب والهامش وقدرة التسليم.','قرر توسيع التجربة أو إيقافها.'],
    new_branch:['حدد لماذا يحتاج العميل فرعًا فعلًا.','اجمع دليل طلب من المنطقة المستهدفة.','احسب نقطة التعادل وأسوأ سيناريو.','صمم Pop-up أو توصيلًا أو نقطة مؤقتة.','اختبر التشغيل دون عقد طويل.','قس الطلب والهامش وجودة التسليم.','قرر: فرع، اختبار أطول، أو توقف.'],
    new_product:['حدد المشكلة التي يحلها المنتج الجديد.','قابل 3 عملاء من الشريحة الحالية.','صمم عرضًا أو نموذجًا أوليًا بسيطًا.','اطلب تجربة أو حجزًا أو دفعًا.','سلّم نسخة صغيرة لعميل واحد.','قس الاستخدام والاستعداد للتكرار.','قرر البناء أو التعديل أو التوقف.'],
    customer_concentration:['احسب حصة أكبر 3 عملاء من الإيراد.','أضف الهامش وسرعة التحصيل لكل منهم.','حدد أثر فقد عميل واحد.','اختر شريحة بديلة قريبة.','اختبر عرضًا على 5 عملاء جدد.','قس الالتزام والهامش المتوقع.','حدد هدف تنويع قابل للقياس.'],
    general_decision:['اكتب القرار والخيارات المتاحة.','افصل الحقائق عن التوقعات.','حدد الدليل الذي قد يغيّر القرار.','صمم اختبارًا صغيرًا لهذا الدليل.','نفّذ الاختبار بحد تكلفة واضح.','سجل النتيجة دون تبريرها.','راجع القرار في موعد محدد.']
  };
  const EXPERIMENTS={
    idea_validation:{hypothesis:'عميل محدد يعتبر المشكلة أولوية الآن.',test:'عرض اختبار صغير على 5 عملاء مناسبين.',duration:'7 أيام',cost:'بدون تجهيز كامل؛ وقت المقابلات فقط.',success:'عميلان يطلبان خطوة تالية فعلية.',stop:'لا يوجد التزام بعد 5 محاولات مناسبة.',review:'نهاية اليوم السابع'},
    pricing:{hypothesis:'شريحة محددة تقبل سعرًا أعلى مقابل عرض أوضح.',test:'عرض السعر الجديد على 5 فرص متشابهة.',duration:'7 أيام',cost:'دون تغيير السعر على الجميع.',success:'الحفاظ على التحويل مع هامش أفضل.',stop:'هبوط واضح في القبول دون تعويض في الهامش.',review:'بعد 5 عروض أو 7 أيام'},
    cashflow:{hypothesis:'تعديل شرط التحصيل يقلل فجوة النقد دون الإضرار بالطلب.',test:'تطبيق شرط جديد على 5 معاملات مناسبة.',duration:'7 أيام',cost:'لا التزام مالي جديد.',success:'انخفاض مدة التحصيل مع ثبات القبول.',stop:'رفض متكرر أو تأخير أكبر.',review:'نهاية اليوم السابع'},
    sales:{hypothesis:'تعديل خطوة واحدة يرفع انتقال العميل للمرحلة التالية.',test:'اختبار نفس التعديل على 10 فرص.',duration:'7 أيام',cost:'وقت متابعة فقط.',success:'تحسن الانتقال مقارنة بالخط الأساسي.',stop:'لا تحسن بعد 10 فرص متشابهة.',review:'بعد الفرصة العاشرة'},
    marketing:{hypothesis:'رسالة محددة تجلب عملاء أنسب لا نقرات أكثر فقط.',test:'حملة صغيرة برسالة واحدة وجمهور واحد.',duration:'7 أيام',cost:'سقف مكتوب قبل البدء.',success:'تحسن العملاء المؤهلين والشراء المتوقع.',stop:'بلوغ السقف دون فرص مناسبة.',review:'عند السقف أو اليوم السابع'},
    cost_reduction:{hypothesis:'يمكن خفض بند واحد دون الإضرار بالتسليم.',test:'خفض مؤقت على نطاق صغير.',duration:'7 أيام',cost:'قابل للرجوع فورًا.',success:'تكلفة أقل مع ثبات الجودة والوقت.',stop:'أي تراجع واضح في الجودة أو الطلب.',review:'نهاية اليوم السابع'},
    operations:{hypothesis:'إزالة اختناق واحد تقلل زمن الدورة.',test:'تغيير خطوة واحدة على 10 طلبات.',duration:'7 أيام',cost:'دون شراء نظام جديد.',success:'وقت أقل دون زيادة الأخطاء.',stop:'زيادة إعادة العمل أو تأخر التسليم.',review:'بعد 10 طلبات'},
    expansion:{hypothesis:'هناك طلب يمكن خدمته دون التزام ثابت كبير.',test:'تجربة محدودة في منطقة أو قناة واحدة.',duration:'7 أيام',cost:'سقف صغير مكتوب.',success:'طلب مدفوع وقدرة تسليم مقبولة.',stop:'غياب الطلب أو تعطل التشغيل.',review:'نهاية التجربة'},
    new_branch:{hypothesis:'المنطقة الجديدة تولد طلبًا يغطي اقتصاديات الفرع.',test:'Pop-up أو توصيل أو نقطة مؤقتة.',duration:'7 أيام',cost:'بدون عقد طويل أو تجهيز كامل.',success:'طلبات مدفوعة وهامش قابل للتكرار.',stop:'طلب ضعيف أو تكلفة خدمة غير مقبولة.',review:'بعد أسبوع التشغيل المؤقت'},
    new_product:{hypothesis:'العميل الحالي مستعد لتجربة المنتج الجديد.',test:'نموذج أولي أو طلب مسبق مع 5 عملاء.',duration:'7 أيام',cost:'تكلفة نسخة أولية واحدة.',success:'حجزان أو تجربتان فعليتان.',stop:'لا التزام بعد 5 عروض مناسبة.',review:'اليوم السابع'},
    customer_concentration:{hypothesis:'شريحة بديلة قريبة يمكنها شراء عرض مربح.',test:'عرض محدد على 5 عملاء جدد.',duration:'7 أيام',cost:'وقت تواصل محدود.',success:'خطوتان جادتان أو طلب واحد.',stop:'لا استجابة من شريحة مناسبة.',review:'بعد المحاولة الخامسة'},
    general_decision:{hypothesis:'دليل واحد محدد يمكنه تغيير القرار.',test:'جمع هذا الدليل بأصغر تجربة ممكنة.',duration:'7 أيام',cost:'سقف مكتوب قبل البدء.',success:'نتيجة واضحة ترجح خيارًا.',stop:'التجربة لا تميز بين الخيارات.',review:'نهاية اليوم السابع'}
  };

  function normalize(value){return String(value||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').trim();}
  function classifyProblem(text,quickChoice,stage){
    const normalized=normalize(text);
    if(!normalized&&quickChoice&&QUICK_MAP[quickChoice]) return QUICK_MAP[quickChoice];
    let best='general_decision',bestScore=0;
    Object.keys(DECISIONS).forEach(type=>{
      let score=0;
      DECISIONS[type].keywords.forEach(keyword=>{if(normalized.includes(normalize(keyword)))score+=normalize(keyword).includes(' ')?3:1;});
      if(type==='idea_validation'&&stage==='idea')score+=1;
      if(type==='new_branch'&&/فرع/.test(normalized))score+=3;
      if(score>bestScore){best=type;bestScore=score;}
    });
    if(bestScore===0&&quickChoice&&QUICK_MAP[quickChoice])return QUICK_MAP[quickChoice];
    return best;
  }
  function decorate(question){return Object.assign({options:SCALE,evidenceWeight:.25},question);}
  function coreQuestions(stage){return (CORE[stage]||CORE.running).map(decorate);}
  function weakAxisFromCore(stage,answers){
    const totals={customer:0,demand:0,economics:0,execution:0,decision:0};
    coreQuestions(stage).forEach(q=>{if(q.axis)totals[q.axis]=Number(answers[q.id]??0);});
    return Object.keys(totals).sort((a,b)=>totals[a]-totals[b])[0];
  }
  function adaptiveQuestions(stage,type,answers){
    const weak=weakAxisFromCore(stage,answers);
    return [...(TYPE_QUESTIONS[type]||TYPE_QUESTIONS.general_decision),STAGE_FOLLOW[stage]||STAGE_FOLLOW.running,WEAK_FOLLOW[weak]].map(decorate);
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function band(value,cuts,labels){return value<cuts[0]?labels[0]:value<cuts[1]?labels[1]:labels[2];}
  function analyze(input){
    const stage=input.stage||'running',type=DECISIONS[input.decisionType]?input.decisionType:'general_decision';
    const questions=input.questions||[],answers=input.answers||{};
    const sums={customer:0,demand:0,economics:0,execution:0,decision:0},counts={customer:0,demand:0,economics:0,execution:0,decision:0};
    let evidenceSum=0,evidenceWeights=0;
    questions.forEach(q=>{
      const value=clamp(Number(answers[q.id]??0),0,3);
      if(q.axis){sums[q.axis]+=value;counts[q.axis]++;}
      const weight=Number(q.evidenceWeight||0);
      if(weight){evidenceSum+=value*weight;evidenceWeights+=weight;}
    });
    const axisScores={};
    Object.keys(AXES).forEach(axis=>axisScores[axis]=Math.round((sums[axis]/Math.max(1,counts[axis]))/3*100));
    const readiness=Math.round(Object.values(axisScores).reduce((a,b)=>a+b,0)/5);
    const evidence=Math.round((evidenceSum/Math.max(1,evidenceWeights))/3*100);
    const riskScore=clamp(Math.round(100-(readiness*.55+evidence*.45)+(DECISIONS[type].riskBias||0)),0,100);
    const readinessBand=band(readiness,[40,70],['منخفض','قيد البناء','أقرب لقرار قابل للدفاع']);
    const evidenceBand=band(evidence,[40,70],['ضعيف','متوسط','قوي']);
    const riskBand=band(riskScore,[36,66],['منخفضة','متوسطة','مرتفعة']);
    let traffic={key:'green',icon:'🟢',title:'المخاطرة منخفضة — تحرك بتجربة محدودة'};
    if(riskBand==='مرتفعة')traffic={key:'red',icon:'🔴',title:'المخاطرة الحالية مرتفعة — لا تزود التزامك المالي'};
    else if(riskBand==='متوسطة')traffic={key:'orange',icon:'🟠',title:'المخاطرة الحالية متوسطة — قلّل المجهول قبل الالتزام'};
    else if(readiness<70||evidence<70)traffic={key:'yellow',icon:'🟡',title:'المخاطرة منخفضة، لكن الدليل يحتاج استكمالًا'};
    const gaps=Object.keys(axisScores).sort((a,b)=>axisScores[a]-axisScores[b]).slice(0,3).map(axis=>({axis,label:AXES[axis],score:axisScores[axis],why:GAP_INFO[axis].why,missing:GAP_INFO[axis].missing}));
    const problem=String(input.problem||input.quickChoice||'القرار الذي تفكر فيه').trim();
    const summary=`اللي كتبته يشير إلى ${DECISIONS[type].label}. وبما إنك في مرحلة ${STAGES[stage]}، فالأولوية الآن هي تقوية ${gaps[0].label} قبل زيادة الالتزام.`;
    return {stage,type,decision:DECISIONS[type],problem,axisScores,readiness,evidence,riskScore,readinessBand,evidenceBand,riskBand,traffic,gaps,summary,plan:PLANS[type],experiment:EXPERIMENTS[type],extraNote:String(input.extraNote||'').trim(),nextDecision:String(input.nextDecision||'').trim()};
  }
  function safeEventData(result){return {stage:result.stage,decision_type:result.type,score_band:result.readinessBand,evidence_band:result.evidenceBand,risk_band:result.riskBand};}
  return {AXES,STAGES,SCALE,QUICK_MAP,DECISIONS,classifyProblem,coreQuestions,adaptiveQuestions,weakAxisFromCore,analyze,safeEventData};
});
