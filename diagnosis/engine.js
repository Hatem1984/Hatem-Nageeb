(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.DecisionLab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const AXES={
    customer:'مين بيشتري منك وليه؟',
    demand:'هل الناس فعلًا عايزة تشتري؟',
    economics:'الفلوس والأرقام عندك واضحة؟',
    execution:'هل الشغل بيتنفذ ويتسلّم كويس؟',
    decision:'عارف هتعمل إيه وإمتى تراجع؟'
  };
  const STAGES={idea:'فكرة / تحت التأسيس',running:'مشروع قائم'};
  const SCALE=[
    {value:0,label:'مش عارف / ما عنديش دليل واضح'},
    {value:1,label:'عندي انطباع أو حالات قليلة'},
    {value:2,label:'عندي تجربة أو أرقام لفترة محدودة'},
    {value:3,label:'عندي بيانات أو مواقف متكررة وبراجعها'}
  ];
  const AXIS_OPTIONS={
    customer:[
      {value:0,label:'مش عارف / مبني على افتراض'},
      {value:1,label:'عندي حالة أو ملاحظة فردية'},
      {value:2,label:'اتكرر مع أكتر من عميل مناسب'},
      {value:3,label:'اتكرر ومعاه سلوك أو شراء يؤكد أهميته'}
    ],
    demand:[
      {value:0,label:'مفيش دليل على طلب فعلي'},
      {value:1,label:'فيه اهتمام أو استفسارات فقط'},
      {value:2,label:'فيه تجربة أو طلبات أولية'},
      {value:3,label:'فيه شراء/حجز أو تكرار واضح'}
    ],
    economics:[
      {value:0,label:'مش عارف الرقم أو مش متجمع'},
      {value:1,label:'عندي تقدير تقريبي'},
      {value:2,label:'حسبته على عينة أو فترة محدودة'},
      {value:3,label:'عندي رقم متسق وبراجعه بانتظام'}
    ],
    execution:[
      {value:0,label:'مش متابع أو مش مقاس'},
      {value:1,label:'بعرف من الخبرة لما المشكلة تحصل'},
      {value:2,label:'قست أو تابعت عينة/فترة محدودة'},
      {value:3,label:'متابعها بانتظام وعندي معيار واضح'}
    ],
    decision:[
      {value:0,label:'مفيش معيار قرار واضح'},
      {value:1,label:'عندي اتجاه عام فقط'},
      {value:2,label:'محدد معيار مبدئي أو موعد مراجعة'},
      {value:3,label:'محدد معيار قرار وحد توقف وموعد مراجعة'}
    ]
  };

  const QUICK_MAP={
    'عندي فكرة مشروع':'idea_validation',
    'التسعير':'pricing',
    'المبيعات':'sales',
    'الوصول لأول عميل':'first_customer',
    'العملاء مش بيرجعوا':'retention',
    'الإعلانات والتسويق':'marketing',
    'السيولة والتحصيل':'cashflow',
    'التشغيل':'operations',
    'التكاليف':'cost_reduction',
    'التوسع':'expansion',
    'فتح فرع':'new_branch',
    'منتج أو خدمة جديدة':'new_product',
    'الاعتماد على عميل كبير':'customer_concentration',
    'قرار آخر':'general_decision'
  };
  const DECISIONS={
    idea_validation:{label:'التأكد إن فكرة المشروع تستاهل تجربة صغيرة',keywords:['فكرة','ابدأ','ابدا','تستحق التنفيذ','مشروع جديد','تحت التاسيس'],confirm:'هل الناس عندها المشكلة فعلًا ومستعدة تاخد خطوة، قبل ما تصرف وقت أو فلوس كبيرة؟',noGo:'ما تجهزش المشروع كامل ولا تشتري أدوات قبل ما عميل مناسب يعمل خطوة حقيقية، مش بس يقول إن الفكرة حلوة.',riskBias:3},
    first_customer:{label:'الوصول لأول عميل فعلي',keywords:['اول عميل','أول عميل','اول زبون','أول زبون','اول بيع','أول بيع'],confirm:'هل محدد مين أول عميل مناسب، وهتوصل له بإيه، وإيه أصغر عرض يقدر يقول عليه نعم أو لا؟',noGo:'ما تبدأش بإعلان واسع أو قنوات كتير قبل ما تختبر رسالة وعرض واضحين مع عدد صغير من عملاء مناسبين.',riskBias:3},
    pricing:{label:'تحديد السعر المناسب',keywords:['تسعير','سعر','اسعر','أُسعّر','ارفع السعر','أرفع السعر','سعري','غالي','رخيص','خصم'],confirm:'هل سعرك مناسب للي العميل بياخده ولتكلفة تنفيذ البيعة؟ وهل تقدر تجرّب تغييره على عدد قليل الأول؟',noGo:'ما تغيّرش السعر لكل العملاء قبل ما تعرف بيفضل لك كام من كل بيعة وتجرب السعر الجديد على عدد قليل.',riskBias:2},
    cashflow:{label:'فهم ليه الفلوس مش متاحة رغم وجود مبيعات',keywords:['كاش','سيولة','تحصيل','قبض','مفيش فلوس','آخر الشهر','اخر الشهر','متاخر في الدفع','متأخر في الدفع'],confirm:'هل المشكلة بسبب تأخر فلوس العملاء، ولا إن المكسب من البيعة قليل، ولا إن المصاريف بتخرج بدري؟',noGo:'ما تزودش المبيعات أو الإعلان قبل ما تفرّق بين البيع والفلوس اللي دخلت فعلًا، وتعرف الفلوس بتدخل بعد كام يوم.',riskBias:5},
    sales:{label:'فهم ليه المهتمين مش بيشتروا',keywords:['مبيعات','بيع','مش ببيع','العملاء مش بتشتري','اقفال','إقفال','صفقات'],confirm:'هل المشكلة في اللي بتعرضه، ولا نوع الناس اللي بتكلمها، ولا خطوة معينة قبل الشراء؟',noGo:'ما تزودش مكالمات أو عروض البيع قبل ما تعرف فين بالضبط الناس بتقف ومابتكملش شراء.',riskBias:2},
    retention:{label:'فهم ليه العميل ما بيرجعش يشتري',keywords:['مش بيرجع','ما بيرجعش','تكرار الشراء','عميل قديم','احتفاظ','retention','repeat'],confirm:'هل عدم الرجوع سببه تجربة العميل، أو المنتج نفسه، أو التوقيت، أو إنك ما بتعملش متابعة مناسبة بعد الشراء؟',noGo:'ما تبدأش خصومات عامة لكل العملاء قبل ما تعرف مين المفروض يرجع، ومين رجع فعلًا، وإيه اللي حصل قبل ما يختفي.',riskBias:3},
    marketing:{label:'فهم هل الإعلان بيجيب ناس مناسبة وبتشتري',keywords:['اعلان','إعلان','تسويق','حملة','ليدز','عملاء محتملين','تكلفة العميل'],confirm:'هل المشكلة إن إعلانك مش بيوصل للناس المناسبة، ولا رسالته مش واضحة، ولا المهتمين مش بيكملوا شراء؟',noGo:'ما تزودش ميزانية الإعلان قبل ما تعرف هل اللي جايين مناسبين، كام واحد اشترى فعلًا، وبيفضل لك كام من البيعة.',riskBias:4},
    cost_reduction:{label:'تقليل المصاريف من غير ما الشغل يتضرر',keywords:['تكاليف','تكلفة','مصروفات','خفض','اوفر','أوفر','غالي عليا'],confirm:'إيه المصروف اللي تقدر تقلله من غير ما البيع أو الجودة أو التسليم يتأثر؟',noGo:'ما تقللش مصروف لمجرد إنه كبير؛ اتأكد الأول إنه مش بيحمي البيع أو الجودة أو التسليم.',riskBias:3},
    operations:{label:'معرفة أكتر خطوة معطلة الشغل',keywords:['تشغيل','تاخير','تأخير','تسليم','جودة','اخطاء','أخطاء','مخزون','عملية','انتاج','إنتاج'],confirm:'أنهي خطوة بتعطّل التسليم أو بتخليك تعيد الشغل بسبب خطأ أو نقص؟',noGo:'ما تعيّنش ناس جديدة ولا تشتري أدوات قبل ما تعرف أنهي خطوة بتعطل الطلبات أو بتخليك تعيد الشغل.',riskBias:3},
    expansion:{label:'التأكد إن الشغل جاهز يكبر',keywords:['توسع','اتوسع','أوسع','تكبير','سوق جديد','منطقة جديدة','نمو سريع'],confirm:'هل فيه ناس عايزة تشتري في المكان الجديد؟ وهل فريقك وأرقامك يسمحوا بتجربة صغيرة من غير مخاطرة كبيرة؟',noGo:'ما تدخلش في مصاريف ثابتة كبيرة قبل ما تجرب الطلب وقدرة فريقك على شغل زيادة في نطاق صغير.',riskBias:10},
    new_branch:{label:'التأكد إن فتح فرع جديد خطوة مناسبة',keywords:['فرع جديد','فتح فرع','افتح فرع','أفتح فرع','فرع تاني','فرع ثاني'],confirm:'هل فيه طلب حقيقي في المنطقة؟ وهل الفرع يقدر يغطي مصاريفه وفريقك يقدر يشغله بنفس الجودة؟',noGo:'ما توقّعش عقد ولا تجهز فرع كامل قبل ما تجرب البيع والتسليم في المنطقة بطريقة مؤقتة وأقل تكلفة.',riskBias:14},
    new_product:{label:'التأكد إن المنتج أو الخدمة الجديدة مطلوبة',keywords:['منتج جديد','خدمة جديدة','اطلق منتج','أطلق منتج','اضيف خدمة','أضيف خدمة'],confirm:'هل المنتج أو الخدمة الجديدة بتحل مشكلة مهمة لدرجة إن العميل يجرب أو يحجز أو يدفع؟',noGo:'ما تعملش المنتج كامل قبل ما تعرض نسخة صغيرة وتشوف هل فيه حد مستعد يجرب أو يحجز أو يدفع.',riskBias:6},
    customer_concentration:{label:'معرفة خطر الاعتماد على عميل أو اتنين',keywords:['عميل واحد','عميل كبير','معظم المبيعات','اعتماد على عميل','تركيز العملاء','خسارة عميل'],confirm:'هل جزء كبير من دخل المشروع جاي من عميل أو اتنين، ولو واحد مشي هتتأثر بقوة؟',noGo:'ما تستخدمش خصومات لكل الناس علشان تعوض الاعتماد على عميل كبير؛ جرّب نوع عملاء أو مكان بيع جديد الأول.',riskBias:8},
    general_decision:{label:'تحديد قرار المشروع اللي محتاج تحسمه',keywords:[],confirm:'إيه القرار المحدد اللي محتاج تعرف عنه حاجة مؤكدة قبل ما تتحرك؟',noGo:'ما تصرفش فلوس أو وقت كبير قبل ما تحدد القرار نفسه وإيه المعلومة اللي لو عرفتها هتغيّره.',riskBias:4}
  };

  const CORE={
    idea:[
      {id:'idea_customer',axis:'customer',evidenceWeight:.5,prompt:'مين العميل الأقرب للفكرة؟ وقد إيه متأكد إن المشكلة دي مهمة له دلوقتي؟',options:[
        {value:0,label:'لسه مش محدد العميل أو المشكلة'},
        {value:1,label:'محددهم بشكل عام من افتراضاتي'},
        {value:2,label:'اتكلمت مع ناس مناسبين وسمعت المشكلة منهم'},
        {value:3,label:'نفس المشكلة اتكررت بوضوح مع أكتر من عميل مناسب'}
      ]},
      {id:'idea_demand',axis:'demand',evidenceWeight:.8,prompt:'إيه أقوى دليل عندك إن العميل مستعد يعمل خطوة فعلية ناحية الحل؟',options:[
        {value:0,label:'مفيش خطوة فعلية لحد دلوقتي'},
        {value:1,label:'فيه إعجاب أو اهتمام بالكلام'},
        {value:2,label:'فيه تجربة أو طلب تفاصيل جاد'},
        {value:3,label:'فيه حجز أو طلب أو دفع فعلي'}
      ]},
      {id:'idea_economics',axis:'economics',evidenceWeight:.5,prompt:'قد إيه أرقام أول بيعة واضحة عندك: سعر البيع، التكلفة المباشرة، واللي هيفضل منها؟',options:[
        {value:0,label:'لسه ما حسبتش الأرقام'},
        {value:1,label:'عندي تقدير عام'},
        {value:2,label:'حسبت نموذج أو سيناريو مبدئي'},
        {value:3,label:'عندي حساب واضح ومراجع للأرقام الأساسية'}
      ]},
      {id:'idea_execution',axis:'execution',evidenceWeight:.4,prompt:'هل تقدر تختبر الفكرة بنسخة صغيرة خلال 7 أيام من غير ما تبني المشروع كامل؟',options:[
        {value:0,label:'مش عارف أبدأ بإيه'},
        {value:1,label:'عندي تصور لكن محتاج تجهيز كبير'},
        {value:2,label:'محدد نسخة بسيطة أقدر أجربها'},
        {value:3,label:'محدد النسخة والعميل وطريقة التسليم فعلًا'}
      ]},
      {id:'idea_decision',axis:'decision',evidenceWeight:.4,prompt:'قبل ما تبدأ التجربة، هل محدد إمتى تعتبرها ناجحة وإمتى تعدّل أو توقف؟',options:[
        {value:0,label:'لا، هجرّب وأشوف'},
        {value:1,label:'عندي فكرة عامة عن النجاح'},
        {value:2,label:'محدد معيار أو اتنين بشكل مبدئي'},
        {value:3,label:'محدد معيار نجاح وحد توقف وموعد مراجعة'}
      ]},
      {id:'idea_evidence',metric:'evidence',evidenceWeight:2,prompt:'لما تقول إن الفكرة واعدة، أقوى حاجة بتعتمد عليها إيه؟',options:[
        {value:0,label:'إحساسي أو رأي ناس قريبة'},
        {value:1,label:'مقابلات أو ملاحظات قليلة'},
        {value:2,label:'تجربة صغيرة أو طلبات أولية'},
        {value:3,label:'شراء/حجز أو سلوك متكرر من عملاء مناسبين'}
      ]}
    ],
    running:[
      {id:'run_customer',axis:'customer',evidenceWeight:.5,prompt:'قد إيه عارف أنهي نوع عميل بيديك أفضل مزيج من تكرار الشراء والرضا والمكسب؟',options:[
        {value:0,label:'مش عارف أو بتعامل كل العملاء بنفس الشكل'},
        {value:1,label:'عندي انطباع من الخبرة'},
        {value:2,label:'عندي ملاحظات أو أرقام لفترة محدودة'},
        {value:3,label:'مقسم العملاء وبراجع الشراء والربحية بانتظام'}
      ]},
      {id:'run_demand',axis:'demand',evidenceWeight:.6,prompt:'هل تقدر تميّز الطلب الحقيقي المتكرر عن مبيعات جاية من خصم أو ظرف مؤقت؟',options:[
        {value:0,label:'لا، كل المبيعات عندي رقم واحد'},
        {value:1,label:'أحيانًا بلاحظ الفرق'},
        {value:2,label:'بفصل بينهم في بعض الفترات أو القنوات'},
        {value:3,label:'بتابع التكرار ومصدر الطلب بشكل واضح ومنتظم'}
      ]},
      {id:'run_economics',axis:'economics',evidenceWeight:.7,prompt:'بالنسبة للقرار اللي بتراجعه، هل السعر والتكلفة والتحصيل من نفس الفترة ومتسجلين بطريقة واحدة؟',options:[
        {value:0,label:'الأرقام مش متجمعة أو مش متوافقة'},
        {value:1,label:'عندي أرقام متفرقة أو من فترات مختلفة'},
        {value:2,label:'جمعت فترة واحدة بشكل مبدئي'},
        {value:3,label:'عندي أرقام متسقة وبراجعها دوريًا'}
      ]},
      {id:'run_execution',axis:'execution',evidenceWeight:.5,prompt:'قد إيه عندك رؤية واضحة لرحلة الطلب من دخوله لحد التسليم والتحصيل؟',options:[
        {value:0,label:'مش متابع الرحلة كاملة'},
        {value:1,label:'بعرف المشاكل لما تحصل'},
        {value:2,label:'متابع أغلب الخطوات ووقت التنفيذ'},
        {value:3,label:'متابع الخطوات والوقت والأخطاء والتحصيل بانتظام'}
      ]},
      {id:'run_decision',axis:'decision',evidenceWeight:.5,prompt:'هل القرار مربوط برقم أو شرط واضح وموعد مراجعة محدد؟',options:[
        {value:0,label:'لا، القرار مبني على الإحساس غالبًا'},
        {value:1,label:'عندي هدف عام فقط'},
        {value:2,label:'محدد رقم أو شرط مبدئي'},
        {value:3,label:'محدد معيار قرار وحد توقف وموعد مراجعة'}
      ]},
      {id:'run_evidence',metric:'evidence',evidenceWeight:2,prompt:'أقوى دليل بتعتمد عليه في القرار الحالي جاي منين؟',options:[
        {value:0,label:'إحساس أو انطباع شخصي'},
        {value:1,label:'ملاحظات أو حالات فردية'},
        {value:2,label:'أرقام أو تجربة لفترة محدودة'},
        {value:3,label:'بيانات متكررة ومراجعة من أكتر من مصدر داخل المشروع'}
      ]}
    ]
  };

  const TYPE_QUESTIONS={
    first_customer:[
      {id:'first_customer_list',axis:'customer',evidenceWeight:1.2,prompt:'قد إيه عندك قائمة فعلية بأشخاص أو شركات ينطبق عليهم وصف العميل المستهدف وتقدر تتواصل معاهم الآن؟',options:[
        {value:0,label:'لسه العميل نفسه مش محدد'},
        {value:1,label:'محدد نوع العميل لكن من غير أسماء أو قائمة'},
        {value:2,label:'عندي قائمة أولية من 5–10 عملاء مناسبين'},
        {value:3,label:'عندي قائمة واتواصلت فعلًا مع جزء منها'}
      ]},
      {id:'first_customer_offer',axis:'demand',evidenceWeight:1.3,prompt:'إيه أقوى استجابة حصلت لما عرضت حلًا واضحًا على عميل مناسب؟',options:[
        {value:0,label:'لسه ما عرضتش على عميل مناسب'},
        {value:1,label:'سمعت اهتمام أو أسئلة فقط'},
        {value:2,label:'فيه طلب تجربة أو مقابلة/عرض جاد'},
        {value:3,label:'فيه طلب أو حجز أو دفع فعلي'}
      ]}
    ],
    idea_validation:[
      {id:'iv_problem',axis:'customer',evidenceWeight:1,prompt:'كام شخص مناسب قال من نفسه إنه بيعاني من نفس المشكلة، من غير ما تشرح له فكرتك؟',options:[{value:0,label:'محدش قالها من نفسه'},{value:1,label:'شخص واحد قال حاجة قريبة'},{value:2,label:'اتنين أو تلاتة وصفوا نفس المشكلة'},{value:3,label:'أكتر من تلاتة كرروا نفس المشكلة بوضوح'}]},
      {id:'iv_commitment',axis:'demand',evidenceWeight:1.5,prompt:'أقوى خطوة عملها حد مهتم كانت إيه؟',options:[{value:0,label:'قال إن الفكرة حلوة بس'},{value:1,label:'وافق يدي وقت أو يتكلم أكتر'},{value:2,label:'وافق يجرب أو طلب تفاصيل جدية'},{value:3,label:'حجز أو طلب أو دفع فعلًا'}]}
    ],
    pricing:[
      {id:'price_margin',axis:'economics',evidenceWeight:1.2,prompt:'قبل ما تثبت أو تغيّر السعر، عارف تكلفة تنفيذ البيعة وقد إيه لازم يفضل لك منها؟',help:'احسب على سعر البيع الفعلي بعد الخصم، ومعاه التكلفة المرتبطة بتنفيذ البيعة.',options:[{value:0,label:'مش عارف التكلفة أو اللي بيفضل من البيعة'},{value:1,label:'عندي تقدير تقريبي فقط'},{value:2,label:'حسبتها لبعض البيعات أو السيناريوهات'},{value:3,label:'عندي حساب واضح وبراجعه مع السعر الفعلي'}]},
      {id:'price_test',axis:'demand',evidenceWeight:1.3,prompt:'إيه أقوى اختبار عملته للسعر مع عميل مناسب؟',help:'السؤال عن رأي العميل أضعف من عرض سعر حقيقي ومراقبة ما فعله.',options:[{value:0,label:'ما اختبرتش السعر لسه'},{value:1,label:'سألت عن الرأي فقط'},{value:2,label:'عرضت السعر على عدد قليل وسجلت ردودهم'},{value:3,label:'عرضت السعر وسجلت القبول والشراء الفعلي'}]}
    ],
    cashflow:[
      {id:'cash_cycle',axis:'economics',evidenceWeight:1.4,prompt:'هل تعرف متوسط الأيام من البيع لحد دخول الفلوس فعلًا؟',help:'المبيعات المسجلة لا تعني إن الكاش دخل في نفس اليوم.',options:[{value:0,label:'مش عارف'},{value:1,label:'بعرف المدة في بعض البيعات فقط'},{value:2,label:'حسبتها لفترة قصيرة أو لعينة من العملاء'},{value:3,label:'متابع المتوسط والاختلاف بين العملاء بانتظام'}]},
      {id:'cash_split',axis:'execution',evidenceWeight:1.1,prompt:'لما تسجل شغلك، بتفرّق بين يوم البيع، ويوم إصدار الفاتورة، ويوم دخول الفلوس، ويوم دفع المصروف؟',options:[{value:0,label:'لا، كله متسجل كرقم واحد'},{value:1,label:'بفرّق بينهم أحيانًا'},{value:2,label:'متفصلين في أغلب البيعات'},{value:3,label:'كل تاريخ متسجل بوضوح وبانتظام'}]}
    ],
    sales:[
      {id:'sales_funnel',axis:'execution',evidenceWeight:1.2,prompt:'عارف أغلب الناس بتقف فين: بعد ما تسأل، ولا بعد ما تعرف السعر، ولا قبل الشراء؟',options:[
        {value:0,label:'مش عارف فين بيقفوا'},
        {value:1,label:'عندي انطباع من بعض المحادثات'},
        {value:2,label:'راجعت عينة وحددت مرحلة تسرب واضحة'},
        {value:3,label:'بتابع عدد الناس في كل مرحلة بانتظام'}
      ]},
      {id:'sales_offer',axis:'customer',evidenceWeight:1,prompt:'اللي بتعرضه بيقول للعميل بوضوح هتحل له إيه والنتيجة اللي هياخدها؟',options:[
        {value:0,label:'العرض بيركز على المنتج أو الخدمة من غير نتيجة واضحة'},
        {value:1,label:'النتيجة موجودة لكنها عامة ومش مرتبطة بعميل محدد'},
        {value:2,label:'النتيجة واضحة لنوع عميل محدد وجربت الصياغة'},
        {value:3,label:'العملاء بيفهموا النتيجة بوضوح وبتظهر في سلوك الشراء'}
      ]}
    ],
    retention:[
      {id:'retention_repeat',axis:'demand',evidenceWeight:1.3,prompt:'قد إيه عارف نسبة أو عدد العملاء اللي رجعوا يشتروا مرة تانية خلال فترة واضحة؟',options:[
        {value:0,label:'مش عارف مين رجع ومين ما رجعش'},
        {value:1,label:'عندي انطباع من الذاكرة'},
        {value:2,label:'حسبتها لفترة أو شريحة محددة'},
        {value:3,label:'بتابعها بانتظام حسب نوع العميل أو المنتج'}
      ]},
      {id:'retention_reason',axis:'customer',evidenceWeight:1.2,prompt:'لما العميل ما يرجعش، قد إيه عندك دليل على السبب الحقيقي؟',options:[
        {value:0,label:'بخمن السبب'},
        {value:1,label:'سمعت سبب من حالات قليلة'},
        {value:2,label:'جمعت أسباب من عدة عملاء'},
        {value:3,label:'الأسباب متكررة ومربوطة بسلوك الشراء أو التوقف'}
      ]}
    ],
    marketing:[
      {id:'marketing_quality',axis:'demand',evidenceWeight:1.2,prompt:'بتتابع كام شخص جاي من الإعلان كان مناسب فعلًا واشترى، مش بس كام واحد بعت رسالة؟',options:[
        {value:0,label:'بتابع الرسائل أو الضغطات فقط'},
        {value:1,label:'بعرف مين مناسب تقريبًا لكن من غير تسجيل منتظم'},
        {value:2,label:'بسجل المناسبين واللي اشتروا في حملات أو فترات محددة'},
        {value:3,label:'بتابع المسار من الإعلان لحد الشراء الفعلي بانتظام'}
      ]},
      {id:'marketing_unit',axis:'economics',evidenceWeight:1.3,prompt:'عارف بتدفع كام في الإعلان علشان تكسب عميل جديد، وبيفضل لك كام من بيعته بعد تكلفة تنفيذها؟',options:[
        {value:0,label:'مش عارف تكلفة العميل ولا اللي بيفضل من بيعته'},
        {value:1,label:'عندي تقدير لواحد منهم فقط'},
        {value:2,label:'حسبت الاتنين على حملة أو فترة محدودة'},
        {value:3,label:'بتابع تكلفة العميل والعائد من بيعته بانتظام'}
      ]}
    ],
    cost_reduction:[
      {id:'cost_value',axis:'economics',evidenceWeight:1.2,prompt:'عارف المصاريف الكبيرة عندك بتحمي إيه: البيع، الجودة، التسليم، ولا مفيش أثر واضح؟',options:[
        {value:0,label:'عارف الإجمالي فقط ومش عارف أثر كل مصروف'},
        {value:1,label:'عارف أثر بعض المصاريف من الخبرة'},
        {value:2,label:'راجعت أكبر المصاريف وربطتها بأثر مبدئي'},
        {value:3,label:'براجع أثر المصاريف الأساسية قبل ما أزودها أو أقللها'}
      ]},
      {id:'cost_test',axis:'execution',evidenceWeight:1,prompt:'هل تقدر تختبر تقليل مصروف واحد بطريقة قابلة للرجوع وتقيس أثرها؟',options:[
        {value:0,label:'لا، أي خفض هيكون شامل ومش هعرف أقيس أثره'},
        {value:1,label:'أقدر أقلله لكن القياس هيكون بالانطباع'},
        {value:2,label:'أقدر أعمل تجربة صغيرة وأقيس مؤشرًا أو اثنين'},
        {value:3,label:'عملت اختبارات مشابهة وبقارن الجودة والوقت والتكلفة قبل وبعد'}
      ]}
    ],
    operations:[
      {id:'ops_wait',axis:'execution',evidenceWeight:1.4,prompt:'متابع الوقت اللي الطلب بيقف فيه، وعدد المرات اللي بتعيد فيها الشغل بسبب خطأ أو نقص؟',options:[
        {value:0,label:'مش متابع الوقت أو إعادة الشغل'},
        {value:1,label:'بعرف المشاكل لما تحصل لكن من غير تسجيل'},
        {value:2,label:'قست عينة من الطلبات أو فترة محدودة'},
        {value:3,label:'بتابع الانتظار وإعادة الشغل بانتظام'}
      ]},
      {id:'ops_customer',axis:'customer',evidenceWeight:1,prompt:'عارف أنهي تأخير بيضايق العميل فعلًا وأنهي تأخير مجرد مشكلة داخلية عندك؟',options:[
        {value:0,label:'بفترض من نفسي إيه اللي يضايق العميل'},
        {value:1,label:'عندي شكاوى أو ملاحظات من حالات قليلة'},
        {value:2,label:'نفس نوع التأخير اتكرر في كلام عدة عملاء'},
        {value:3,label:'مربط التأخير بشكاوى أو إلغاءات أو تكرار شراء فعلي'}
      ]}
    ],
    expansion:[
      {id:'expand_repeat',axis:'execution',evidenceWeight:1.2,prompt:'لو الشغل زاد فجأة، فريقك ونظامك يقدروا يستحملوا من غير ما الجودة أو التسليم يقعوا؟',options:[{value:0,label:'لا، الشغل واقف عليّ أو بيتعطل'},{value:1,label:'نقدر بصعوبة ولمدة قصيرة'},{value:2,label:'جربنا زيادة بسيطة والشغل استمر'},{value:3,label:'عندنا طريقة واضحة تستحمل شغل زيادة'}]},
      {id:'expand_demand',axis:'demand',evidenceWeight:1.4,prompt:'إيه أقوى دليل إن السوق أو المنطقة الجديدة فيها طلب حقيقي؟',options:[
        {value:0,label:'مجرد توقع أو إحساس'},
        {value:1,label:'استفسارات أو اهتمام بدون خطوة جدية'},
        {value:2,label:'طلبات أو تجارب أولية من السوق الجديد'},
        {value:3,label:'مبيعات أو حجوزات متكررة من السوق الجديد'}
      ]}
    ],
    new_branch:[
      {id:'branch_demand',axis:'demand',evidenceWeight:1.5,prompt:'فيه ناس من المنطقة الجديدة طلبت تشتري أو سألت بشكل جاد فعلًا؟',options:[{value:0,label:'لا، ده توقع مني'},{value:1,label:'فيه أسئلة عابرة من ناس قليلة'},{value:2,label:'فيه طلبات أو محادثات جدية'},{value:3,label:'فيه طلبات أو مبيعات متكررة من المنطقة'}]},
      {id:'branch_economics',axis:'economics',evidenceWeight:1.3,prompt:'عارف الفرع لازم يبيع تقريبًا بكام كل شهر علشان يغطي مصاريفه؟ ولو المبيعات طلعت أقل من المتوقع، تقدر تستحمل قد إيه؟',options:[{value:0,label:'مش عارف'},{value:1,label:'عندي تقدير عام للمصاريف'},{value:2,label:'حسبت المبيعات المطلوبة بشكل مبدئي'},{value:3,label:'عندي حساب واضح وعارف أقدر أستحمل لحد إمتى'}]}
    ],
    new_product:[
      {id:'product_problem',axis:'customer',evidenceWeight:1.2,prompt:'إيه أقوى دليل إن المشكلة اللي المنتج الجديد بيحلها مهمة للعميل دلوقتي؟',options:[
        {value:0,label:'افتراض مني من غير كلام مباشر من العميل'},
        {value:1,label:'سمعتها من حالة أو حالتين'},
        {value:2,label:'اتكررت من عدة عملاء مناسبين'},
        {value:3,label:'اتكررت ومعاها طلب لحل أو تجربة أو شراء'}
      ]},
      {id:'product_preorder',axis:'demand',evidenceWeight:1.5,prompt:'قبل ما تعمل المنتج كامل، إيه أقوى التزام أخدته من عميل؟',options:[
        {value:0,label:'مفيش التزام لسه'},
        {value:1,label:'اهتمام أو طلب معلومات فقط'},
        {value:2,label:'وافق يجرب أو طلب حجزًا مبدئيًا'},
        {value:3,label:'حجز أو دفع أو اشترى نسخة أولية'}
      ]}
    ],
    customer_concentration:[
      {id:'concentration_share',axis:'economics',evidenceWeight:1.3,prompt:'قد إيه صورة اعتمادك على أكبر العملاء واضحة بالأرقام؟',options:[
        {value:0,label:'مش عارف نسبة أكبر العملاء من الدخل'},
        {value:1,label:'عارف أكبر عميل تقريبًا فقط'},
        {value:2,label:'حسبت نسبة أكبر 3 عملاء من الدخل'},
        {value:3,label:'عارف النسبة + الربحية + مدة التحصيل لكل عميل كبير'}
      ]},
      {id:'concentration_alt',axis:'demand',evidenceWeight:1.1,prompt:'إيه أقوى دليل إن عندك مصدر طلب بديل لو عميل كبير قلّل أو وقف؟',options:[
        {value:0,label:'مفيش بديل مجرّب'},
        {value:1,label:'فيه ناس مهتمة لكن من غير شراء'},
        {value:2,label:'جربت مع عملاء جدد وفيه طلبات أولية'},
        {value:3,label:'عندي عملاء جدد بيدفعوا وبدأوا يقللوا الاعتماد على الكبار'}
      ]}
    ],
    general_decision:[
      {id:'general_options',axis:'decision',evidenceWeight:1,prompt:'قد إيه البدائل قدامك مكتوبة ومقارنة بدل ما تكون مركز على اختيار واحد؟',options:[
        {value:0,label:'مركز على اختيار واحد فقط'},
        {value:1,label:'عندي بديل أو اتنين في دماغي'},
        {value:2,label:'كتبت البدائل وقارنتهم بشكل مبدئي'},
        {value:3,label:'كتبت البدائل ومعايير المقارنة والقيود لكل بديل'}
      ]},
      {id:'general_change',axis:'decision',evidenceWeight:1.2,prompt:'هل محدد المعلومة اللي لو ظهرت هتغيّر قرارك فعلًا؟',options:[
        {value:0,label:'مش عارف إيه اللي ممكن يغيّر قراري'},
        {value:1,label:'عندي فكرة عامة لكن مش محددة'},
        {value:2,label:'محدد معلومة واحدة حاسمة'},
        {value:3,label:'محدد المعلومة والحد اللي عنده هغيّر أو أوقف القرار'}
      ]}
    ]
  };

  const STAGE_FOLLOW={
    idea:{id:'stage_idea_commitment',axis:'demand',evidenceWeight:1,prompt:'قبل ما تعتبر الاهتمام دليل طلب، إيه أقوى التزام أخدته من عميل مناسب؟',options:[
      {value:0,label:'مفيش التزام؛ مجرد رأي أو إعجاب'},
      {value:1,label:'وافق يتكلم أو يشوف تفاصيل'},
      {value:2,label:'وافق يجرب أو يحجز مبدئيًا'},
      {value:3,label:'طلب أو حجز أو دفع فعلًا'}
    ]},
    running:{id:'stage_run_90days',axis:'economics',evidenceWeight:1,prompt:'لو طلبت دلوقتي أرقام آخر 90 يوم الخاصة بالقرار، هتطلعها قد إيه بسهولة وبنفس التعريفات؟',options:[
      {value:0,label:'مش متاحة أو كل مصدر بيدي رقم مختلف'},
      {value:1,label:'هجمعها يدويًا وهتحتاج تنضيف كبير'},
      {value:2,label:'معظمها متاح لكن محتاج مراجعة بسيطة'},
      {value:3,label:'متاحة ومتسقة وأقدر أراجعها فورًا'}
    ]}
  };

  const WEAK_FOLLOW={
    customer:{id:'weak_customer',axis:'customer',evidenceWeight:1,prompt:'لما توصف مشكلة العميل، قد إيه الكلام ده جاي من العميل نفسه؟',options:[
      {value:0,label:'من افتراضاتي أنا'},
      {value:1,label:'من كلام حالة أو حالتين'},
      {value:2,label:'اتكرر مع عدة عملاء مناسبين'},
      {value:3,label:'اتكرر ومعاه تصرف أو شراء يؤكد أهميته'}
    ]},
    demand:{id:'weak_demand',axis:'demand',evidenceWeight:1.2,prompt:'قد إيه عندك سلوك حقيقي تقدر تعدّه بدل كلام الاهتمام؟',options:[
      {value:0,label:'مفيش سلوك قابل للعد'},
      {value:1,label:'استفسارات أو اهتمام فقط'},
      {value:2,label:'تجارب/طلبات أولية قابلة للعد'},
      {value:3,label:'شراء/حجز متكرر أو التزام واضح'}
    ]},
    economics:{id:'weak_economics',axis:'economics',evidenceWeight:1.2,prompt:'قد إيه الأرقام اللي بتعتمد عليها موثقة: مصدرها، فترتها، وتعريفها؟',options:[
      {value:0,label:'الأرقام تقديرية أو غير موثقة'},
      {value:1,label:'بعضها معروف المصدر وبعضها لا'},
      {value:2,label:'معظمها موثق لنفس الفترة'},
      {value:3,label:'كل رقم له مصدر وفترة وتعريف واضح'}
    ]},
    execution:{id:'weak_execution',axis:'execution',evidenceWeight:1,prompt:'هل قست خطوة واحدة على الأقل في التشغيل من حيث الوقت والجودة والتكلفة؟',options:[
      {value:0,label:'لا، ما قستش'},
      {value:1,label:'عندي تقدير من الخبرة'},
      {value:2,label:'قستها لفترة أو على عينة'},
      {value:3,label:'بقيسها بانتظام وبعرف الانحرافات'}
    ]},
    decision:{id:'weak_decision',axis:'decision',evidenceWeight:1,prompt:'قد إيه القرار له نقطة بداية وحد توقف وموعد مراجعة واضحين؟',options:[
      {value:0,label:'مش محددين'},
      {value:1,label:'واحد منهم واضح فقط'},
      {value:2,label:'معظمهم محدد بشكل مبدئي'},
      {value:3,label:'البداية وحد التوقف وموعد المراجعة محددين'}
    ]}
  };

  const GAP_INFO={
    customer:{why:'لو مش محدد مين العميل وإيه مشكلته، ممكن تقدم حاجة كويسة لشخص مش محتاجها.',missing:'كلام أو تصرف مباشر من عميل مناسب يوضح إن المشكلة مهمة له دلوقتي.'},
    demand:{why:'الإعجاب مش معناه إن الشخص هيشتري؛ القرار محتاج خطوة حقيقية تقدر تعدّها.',missing:'طلب أو تجربة أو حجز أو شراء فعلي، مش مجرد كلام مشجع.'},
    economics:{why:'لو الأرقام من أوقات مختلفة أو متسجلة بطرق مختلفة، مش هتعرف تأثير السعر والمصاريف وتأخر الدفع.',missing:'أرقام من نفس الفترة توضح دخل كل بيعة، وتكلفتها، والفلوس اللي دخلت فعلًا.'},
    execution:{why:'حتى القرار الجيد ممكن يتعطل لو خطوات الشغل مش واضحة أو الأخطاء بتتكرر.',missing:'قياس لوقت تنفيذ الطلب، وفترات الانتظار، والأخطاء اللي بتخليك تعيد الشغل.'},
    decision:{why:'لو مش محدد إمتى تكمل وإمتى توقف وتراجع، التجربة ممكن تستمر وتستهلك فلوس ووقت بلا نهاية.',missing:'قرار واضح، ورقم أساسي تقرر عليه، ووقت محدد للتوقف والمراجعة.'}
  };

  const EXPERIMENTS={
    first_customer:{hypothesis:'نوع محدد من العملاء عنده المشكلة ومستعد يسمع عرضًا صغيرًا واضحًا.',test:'اختار 10 عملاء مناسبين، تواصل معاهم برسالة واحدة واضحة، واعرض خطوة صغيرة قابلة للشراء أو التجربة.',duration:'7 أيام',cost:'وقت التواصل فقط، من غير حملة واسعة أو تجهيزات كبيرة.',success:'على الأقل محادثتان جادتان وعميل واحد يطلب تجربة أو يحجز أو يشتري.',stop:'بعد 10 محاولات مع عملاء مناسبين مفيش استجابة جدية؛ راجع وصف العميل أو المشكلة أو العرض.',review:'بعد المحاولة العاشرة أو نهاية اليوم السابع'},
    idea_validation:{hypothesis:'ناس محددة عندها المشكلة دلوقتي ومستعدة تعمل خطوة علشان تحلها.',test:'اعرض تجربة صغيرة على 5 أشخاص مناسبين.',duration:'7 أيام',cost:'وقت المقابلات فقط، من غير تجهيز المشروع كامل.',success:'شخصان على الأقل يطلبوا يجربوا أو يحجزوا أو يدفعوا.',stop:'بعد 5 محاولات مناسبة، محدش عمل خطوة حقيقية.',review:'نهاية اليوم السابع'},
    pricing:{hypothesis:'نوع محدد من العملاء هيقبل سعرًا أعلى لو فهم بوضوح هو هياخد إيه.',test:'اعرض السعر الجديد على 5 أشخاص متشابهين.',duration:'7 أيام',cost:'ما تغيّرش السعر لكل العملاء أثناء التجربة.',success:'نفس نسبة الشراء تقريبًا، مع مبلغ أكبر بيفضل لك من كل بيعة.',stop:'عدد اللي بيشتروا قل بوضوح، والزيادة في السعر ما عوضتش الفرق.',review:'بعد 5 عروض أو 7 أيام'},
    cashflow:{hypothesis:'تغيير ميعاد أو طريقة الدفع هيخلي الفلوس تدخل أسرع من غير ما يقل الشراء.',test:'جرّب طريقة الدفع الجديدة في 5 بيعات مناسبة.',duration:'7 أيام',cost:'من غير أي مصروف جديد يصعب ترجع فيه.',success:'الفلوس تدخل في وقت أقصر، ونفس عدد العملاء تقريبًا يوافق.',stop:'العملاء يرفضوا بشكل متكرر أو الدفع يتأخر أكتر.',review:'نهاية اليوم السابع'},
    sales:{hypothesis:'تغيير خطوة واحدة هيخلي ناس أكتر تكمل للخطوة اللي بعدها.',test:'جرّب نفس التغيير مع 10 أشخاص مهتمين.',duration:'7 أيام',cost:'وقت المتابعة فقط.',success:'عدد أكبر من الناس يكمل مقارنة بما كان بيحصل قبل التغيير.',stop:'مفيش تحسن بعد 10 أشخاص متشابهين.',review:'بعد الشخص العاشر'},
    retention:{hypothesis:'سبب محدد في تجربة ما بعد الشراء أو المتابعة هو اللي بيقلل رجوع العميل.',test:'اختار 10 عملاء اشتروا قبل كده، اسألهم سؤالًا واحدًا عن سبب الرجوع أو عدمه، وجرّب متابعة واحدة محسنة على مجموعة صغيرة.',duration:'7 أيام',cost:'وقت متابعة فقط، من غير خصم عام.',success:'تحدد سببًا متكررًا وتلاحظ استجابة أفضل للمجموعة اللي اتطبقت عليها المتابعة.',stop:'الأسباب متفرقة جدًا أو المتابعة الجديدة ما غيرتش أي سلوك؛ وقتها ارجع للمنتج أو شريحة العميل.',review:'بعد 10 عملاء أو نهاية اليوم السابع'},
    marketing:{hypothesis:'رسالة محددة هتجيب ناس أنسب للشراء، مش مجرد ضغطات أو رسائل أكتر.',test:'اعمل إعلانًا صغيرًا برسالة واحدة ولنفس نوع الناس.',duration:'7 أيام',cost:'اكتب أقصى مبلغ هتصرفه قبل ما تبدأ.',success:'ناس مناسبة أكتر تكمل للشراء أو تعمل خطوة جدية.',stop:'تصرف المبلغ المحدد من غير ما ييجي ناس مناسبة.',review:'لما المبلغ يخلص أو في اليوم السابع'},
    cost_reduction:{hypothesis:'تقدر تقلل مصروفًا واحدًا من غير ما الجودة أو التسليم يتأثروا.',test:'قلل المصروف لفترة قصيرة وفي جزء صغير من الشغل.',duration:'7 أيام',cost:'اختار تغييرًا تقدر ترجع عنه فورًا.',success:'المصروف يقل والجودة وميعاد التسليم يفضلوا زي ما هم.',stop:'أي تراجع واضح في الجودة أو الطلب أو التسليم.',review:'نهاية اليوم السابع'},
    operations:{hypothesis:'حل أكتر خطوة معطلة هيقلل وقت تنفيذ الطلب.',test:'غيّر خطوة واحدة وجرّبها على 10 طلبات.',duration:'7 أيام',cost:'من غير شراء برنامج أو نظام جديد.',success:'الطلبات تخلص أسرع من غير زيادة الأخطاء.',stop:'الأخطاء تزيد، أو تضطر تعيد الشغل، أو التسليم يتأخر.',review:'بعد 10 طلبات'},
    expansion:{hypothesis:'فيه ناس مستعدة تشتري في المكان الجديد، وفريقك يقدر يخدمها من غير مصاريف كبيرة ثابتة.',test:'جرّب البيع في منطقة واحدة أو بطريقة بيع واحدة.',duration:'7 أيام',cost:'حدد مبلغًا صغيرًا كحد أقصى قبل البداية.',success:'طلبات مدفوعة تتسلّم بجودة وميعاد مقبولين.',stop:'مفيش شراء فعلي أو الشغل الحالي اتعطل.',review:'نهاية التجربة'},
    new_branch:{hypothesis:'المنطقة الجديدة فيها شراء فعلي يكفي لتغطية مصاريف الفرع.',test:'جرّب يوم بيع مؤقت، أو التوصيل، أو نقطة استلام بسيطة.',duration:'7 أيام',cost:'من غير عقد طويل أو تجهيز فرع كامل.',success:'طلبات مدفوعة، وبيفضل مبلغ مناسب من كل بيعة، وتقدر تكرر التسليم بنفس الجودة.',stop:'الطلبات قليلة أو تكلفة توصيل وخدمة الطلبات أعلى من المقبول.',review:'بعد أسبوع التجربة'},
    new_product:{hypothesis:'العملاء الحاليون مستعدين يجربوا المنتج الجديد أو يحجزوه.',test:'اعرض عينة بسيطة أو حجزًا مسبقًا على 5 عملاء.',duration:'7 أيام',cost:'تكلفة عمل عينة واحدة بسيطة.',success:'شخصان يحجزوا أو يجربوا فعلًا.',stop:'بعد 5 عروض مناسبة، محدش عمل خطوة حقيقية.',review:'اليوم السابع'},
    customer_concentration:{hypothesis:'نوع قريب من العملاء الحاليين ممكن يشتري منك بسعر يترك لك مكسبًا مناسبًا.',test:'اعرض حاجة محددة على 5 عملاء جدد.',duration:'7 أيام',cost:'وقت تواصل محدود، من غير مصروف كبير.',success:'شخصان يعملوا خطوة جدية أو شخص واحد يطلب فعلًا.',stop:'بعد 5 محاولات مع ناس مناسبة، مفيش استجابة.',review:'بعد المحاولة الخامسة'},
    general_decision:{hypothesis:'معلومة واحدة محددة ممكن تغيّر القرار.',test:'اعمل أصغر تجربة تقدر تجيب لك المعلومة دي.',duration:'7 أيام',cost:'اكتب أقصى مبلغ هتصرفه قبل ما تبدأ.',success:'النتيجة توضّح إن اختيارًا أنسب من الباقي.',stop:'التجربة خلصت ولسه مش بتفرق بين الاختيارات.',review:'نهاية اليوم السابع'}
  };

  function normalize(value){return String(value||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').trim();}
  const AXIS_PRIORITY={
    first_customer:['customer','demand','execution','decision','economics'],
    idea_validation:['demand','customer','decision','economics','execution'],
    pricing:['economics','demand','customer','decision','execution'],
    cashflow:['economics','execution','decision','demand','customer'],
    sales:['demand','customer','execution','decision','economics'],
    retention:['customer','demand','execution','economics','decision'],
    marketing:['demand','economics','customer','decision','execution'],
    cost_reduction:['economics','execution','decision','customer','demand'],
    operations:['execution','customer','economics','decision','demand'],
    expansion:['execution','demand','economics','decision','customer'],
    new_branch:['demand','economics','execution','decision','customer'],
    new_product:['demand','customer','economics','execution','decision'],
    customer_concentration:['economics','demand','customer','decision','execution'],
    general_decision:['decision','economics','demand','customer','execution']
  };
  function rankAxes(type,scores){
    const priority=AXIS_PRIORITY[type]||AXIS_PRIORITY.general_decision;
    return Object.keys(scores).sort((a,b)=>{
      const diff=Number(scores[a]||0)-Number(scores[b]||0);
      if(diff!==0)return diff;
      return priority.indexOf(a)-priority.indexOf(b);
    });
  }
  function classifyProblem(text,quickChoice,stage){
    const normalized=normalize(text);
    if(quickChoice&&quickChoice!=='قرار آخر'&&QUICK_MAP[quickChoice]) return QUICK_MAP[quickChoice];
    if(!normalized&&quickChoice&&QUICK_MAP[quickChoice]) return QUICK_MAP[quickChoice];
    let best='general_decision',bestScore=0;
    Object.keys(DECISIONS).forEach(type=>{
      let score=0;
      DECISIONS[type].keywords.forEach(keyword=>{if(normalized.includes(normalize(keyword)))score+=normalize(keyword).includes(' ')?3:1;});
      if(type==='new_branch'&&/فرع/.test(normalized))score+=3;
      if(score>bestScore){best=type;bestScore=score;}
    });
    if(bestScore===0&&quickChoice&&QUICK_MAP[quickChoice])return QUICK_MAP[quickChoice];
    return best;
  }
  function decorate(question){
    const defaults={options:(question.axis&&AXIS_OPTIONS[question.axis])||SCALE,evidenceWeight:0,help:'اختار أقرب وصف لواقعك الحالي واعتمد على حاجة تقدر تراجعها أو تعدّها.'};
    return Object.assign(defaults,question);
  }
  function coreQuestions(stage){return (CORE[stage]||CORE.running).map(decorate);}
  function weakAxisFromCore(stage,answers,type='general_decision'){
    const totals={customer:0,demand:0,economics:0,execution:0,decision:0};
    coreQuestions(stage).forEach(q=>{if(q.axis)totals[q.axis]=Number(answers[q.id]??0);});
    return rankAxes(type,totals)[0];
  }
  function adaptiveQuestions(stage,type,answers){
    const weak=weakAxisFromCore(stage,answers,type);
    return [...(TYPE_QUESTIONS[type]||TYPE_QUESTIONS.general_decision),STAGE_FOLLOW[stage]||STAGE_FOLLOW.running,WEAK_FOLLOW[weak]].map(decorate);
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function band(value,cuts,labels){return value<cuts[0]?labels[0]:value<cuts[1]?labels[1]:labels[2];}
  function focusAction(gap,index){
    const prefix=gap.score<40?'اقفل الفجوة':gap.score<70?'قوّي الدليل':'راجع أحدث دليل';
    return prefix+' في «'+gap.label+'»: '+gap.missing;
  }
  function personalizedPlan(type,gaps,stage){
    const experiment=EXPERIMENTS[type]||EXPERIMENTS.general_decision;
    const label=DECISIONS[type]?.label||DECISIONS.general_decision.label;
    return [
      'اكتب القرار بصيغة واحدة محددة: «'+label+'»، وحدد إيه اللي هيتغير لو القرار كان صح.',
      focusAction(gaps[0],0),
      focusAction(gaps[1],1),
      focusAction(gaps[2],2),
      'نفّذ أصغر تجربة مناسبة: '+experiment.test,
      'سجّل النتيجة كما حدثت، وقارنها بمعيار النجاح: '+experiment.success,
      'اتخذ الخطوة التالية على أساس النتيجة: استمر لو المعيار تحقق، وإلا عدّل أو توقف. راجع القرار: '+experiment.review
    ];
  }

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
    const riskBand=band(riskScore,[30,60],['منخفضة','متوسطة','مرتفعة']);
    let traffic={key:'green',icon:'🟢',title:'عندك أساس يسمح بتجربة محدودة قابلة للرجوع'};
    if(riskBand==='مرتفعة')traffic={key:'red',icon:'🔴',title:'الدليل الحالي مش كفاية لالتزام كبير'};
    else if(riskBand==='متوسطة')traffic={key:'orange',icon:'🟠',title:'اختبر على نطاق صغير قبل ما تكبّر الالتزام'};
    else if(readiness<70||evidence<70)traffic={key:'yellow',icon:'🟡',title:'الصورة قريبة، لكن محتاجة دليل أوضح في نقطة محددة'};
    const rankedAxes=rankAxes(type,axisScores);
    const weakAxes=rankedAxes.filter(axis=>axisScores[axis]<70);
    const reviewMode=weakAxes.length===0;
    const chosenAxes=(reviewMode?rankedAxes.slice(0,3):weakAxes.slice(0,3));
    const gapsTitle=reviewMode?'نقط راجعها قبل ما تكبّر الالتزام':'أهم الحاجات الناقصة قبل ما تتحرك';
    const gaps=chosenAxes.map(axis=>reviewMode
      ? {axis,label:AXES[axis],score:axisScores[axis],why:'المحور ده قوي نسبيًا في إجاباتك، لكن راجعه قبل أي التزام أكبر علشان تتأكد إن الدليل ما زال حديثًا.',missing:GAP_INFO[axis].missing,reviewOnly:true}
      : {axis,label:AXES[axis],score:axisScores[axis],why:GAP_INFO[axis].why,missing:GAP_INFO[axis].missing,reviewOnly:false}
    );
    const problem=String(input.problem||input.quickChoice||'القرار الذي تفكر فيه').trim();
    const summary=`قرارك أقرب إلى: ${DECISIONS[type].label}. أهم نقطة تراجعها الآن: ${gaps[0].label}.`;
    const experiment=EXPERIMENTS[type]||EXPERIMENTS.general_decision;
    let guidance={
      key:'proceed',
      title:'تحرّك بتجربة محدودة، مش بالتزام كامل',
      reason:`عندك أساس جيد نسبيًا، لكن راجع «${gaps[0].label}» قبل ما تكبّر الالتزام.`,
      action:experiment.test
    };
    if(riskBand==='مرتفعة'){
      guidance={
        key:'hold',
        title:'ما تلتزمش بمصاريف كبيرة دلوقتي',
        reason:`الدليل الحالي لسه ضعيف نسبيًا، وأكبر فجوة عندك هي «${gaps[0].label}».`,
        action:experiment.test
      };
    }else if(riskBand==='متوسطة'){
      guidance={
        key:'test',
        title:'اعمل اختبار صغير قبل القرار النهائي',
        reason:`عندك جزء من الصورة، لكن «${gaps[0].label}» لسه ممكن تغيّر القرار.`,
        action:experiment.test
      };
    }
    const plan=personalizedPlan(type,gaps,stage);
    return {stage,type,decision:DECISIONS[type],problem,axisScores,readiness,evidence,riskScore,readinessBand,evidenceBand,riskBand,traffic,gaps,gapsTitle,summary,guidance,plan,experiment};
  }
  function safeEventData(result){return {stage:result.stage,decision_type:result.type,score_band:result.readinessBand,evidence_band:result.evidenceBand,risk_band:result.riskBand};}
  return {AXES,STAGES,SCALE,QUICK_MAP,DECISIONS,classifyProblem,coreQuestions,adaptiveQuestions,weakAxisFromCore,analyze,safeEventData};
});
